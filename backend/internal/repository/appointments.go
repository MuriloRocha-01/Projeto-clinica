package repository

import (
	"agendamento-clinica/backend/internal/models"
	"context"
	"errors"
	"github.com/jackc/pgx/v5"
	"log"
	"time"
)

var (
	ErrNotFound = errors.New("registro não encontrado na clínica informada")
)

func (r *Repository) ProfessionalClinic(ctx context.Context, id int64) (int64, error) {
	var clinicID int64
	err := r.Pool.QueryRow(ctx, "SELECT clinic_id FROM professionals WHERE id=$1", id).Scan(&clinicID)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, ErrNotFound
	}
	return clinicID, err
}

func (r *Repository) AppointmentClinic(ctx context.Context, id int64) (int64, error) {
	var clinicID int64
	err := r.Pool.QueryRow(ctx, "SELECT clinic_id FROM appointments WHERE id=$1", id).Scan(&clinicID)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, ErrNotFound
	}
	return clinicID, err
}

// All booking/status writers lock the professional first, then check conflicts.
// READ COMMITTED makes the check see bookings committed by the previous holder.
func lockProfessional(ctx context.Context, tx pgx.Tx, clinicID, professionalID int64) ([]models.Availability, error) {
	var slots []models.Availability
	err := tx.QueryRow(ctx, "SELECT availability FROM professionals WHERE clinic_id=$1 AND id=$2 FOR UPDATE", clinicID, professionalID).Scan(&slots)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return slots, err
}

func hasConflict(ctx context.Context, tx pgx.Tx, a models.Appointment) (bool, error) {
	var exists bool
	err := tx.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM appointments WHERE clinic_id=$1 AND professional_id=$2 AND id<>$3 AND status<>'cancelado' AND start_time<$4 AND end_time>$5)`, a.ClinicID, a.ProfessionalID, a.ID, a.EndTime, a.StartTime).Scan(&exists)
	return exists, err
}

func rollback(tx pgx.Tx) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := tx.Rollback(ctx); err != nil && !errors.Is(err, pgx.ErrTxClosed) {
		log.Printf("rollback: %v", err)
	}
}

const appointmentColumns = "id,clinic_id,professional_id,client_id,start_time,end_time,status,notes,created_at,check_in_at,called_at,completed_at,priority"

func scanAppointment(row pgx.Row) (a models.Appointment, err error) {
	err = row.Scan(&a.ID, &a.ClinicID, &a.ProfessionalID, &a.ClientID, &a.StartTime, &a.EndTime, &a.Status, &a.Notes, &a.CreatedAt, &a.CheckInAt, &a.CalledAt, &a.CompletedAt, &a.Priority)
	return
}

func (r *Repository) CreateAppointment(ctx context.Context, a models.Appointment, validate func([]models.Availability, bool) error) (models.Appointment, error) {
	tx, err := r.Pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.ReadCommitted})
	if err != nil {
		return a, err
	}
	defer rollback(tx)
	slots, err := lockProfessional(ctx, tx, a.ClinicID, a.ProfessionalID)
	if err != nil {
		return a, err
	}
	var exists bool
	err = tx.QueryRow(ctx, "SELECT EXISTS (SELECT 1 FROM clients WHERE clinic_id=$1 AND id=$2)", a.ClinicID, a.ClientID).Scan(&exists)
	if err != nil {
		return a, err
	}
	if !exists {
		return a, ErrNotFound
	}
	// Validation is supplied by the service and runs while the row lock is held.
	if err = validate(slots, false); err != nil {
		return a, err
	}
	conflict, err := hasConflict(ctx, tx, a)
	if err != nil {
		return a, err
	}
	if conflict {
		if err = validate(slots, true); err != nil {
			return a, err
		}
	}
	a, err = scanAppointment(tx.QueryRow(ctx, "INSERT INTO appointments (clinic_id,professional_id,client_id,start_time,end_time,notes,priority) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING "+appointmentColumns, a.ClinicID, a.ProfessionalID, a.ClientID, a.StartTime, a.EndTime, a.Notes, a.Priority))
	if err != nil {
		return a, err
	}
	return a, tx.Commit(ctx)
}

func (r *Repository) ListAppointments(ctx context.Context, clinicID, professionalID int64, date time.Time) ([]models.Appointment, error) {
	var exists bool
	err := r.Pool.QueryRow(ctx, "SELECT EXISTS (SELECT 1 FROM professionals WHERE clinic_id=$1 AND id=$2)", clinicID, professionalID).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrNotFound
	}
	rows, err := r.Pool.Query(ctx, "SELECT "+appointmentColumns+" FROM appointments WHERE clinic_id=$1 AND professional_id=$2 AND start_time<$3 AND end_time>$4 ORDER BY start_time,id", clinicID, professionalID, date.AddDate(0, 0, 1), date)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, pgx.RowToStructByName[models.Appointment])
}

type StatusChange struct{ CheckIn, Called, Completed, Reset bool }

func (r *Repository) UpdateAppointmentStatus(ctx context.Context, clinicID, id int64, status string, validate func(models.Appointment, []models.Availability, bool) (StatusChange, error)) (models.Appointment, error) {
	var a models.Appointment
	tx, err := r.Pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.ReadCommitted})
	if err != nil {
		return a, err
	}
	defer rollback(tx)
	var professionalID int64
	err = tx.QueryRow(ctx, "SELECT professional_id FROM appointments WHERE clinic_id=$1 AND id=$2", clinicID, id).Scan(&professionalID)
	if errors.Is(err, pgx.ErrNoRows) {
		return a, ErrNotFound
	}
	if err != nil {
		return a, err
	}
	slots, err := lockProfessional(ctx, tx, clinicID, professionalID)
	if err != nil {
		return a, err
	}
	a, err = scanAppointment(tx.QueryRow(ctx, "SELECT "+appointmentColumns+" FROM appointments WHERE clinic_id=$1 AND id=$2 FOR UPDATE", clinicID, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return a, ErrNotFound
	}
	if err != nil {
		return a, err
	}
	change, err := validate(a, slots, false)
	if err != nil {
		return a, err
	}
	if a.Status == status {
		return a, tx.Commit(ctx)
	}
	if status != "cancelado" {
		conflict, err := hasConflict(ctx, tx, a)
		if err != nil {
			return a, err
		}
		if conflict {
			if _, err := validate(a, slots, true); err != nil {
				return a, err
			}
		}
	}
	a, err = scanAppointment(tx.QueryRow(ctx, `UPDATE appointments SET status=$3::text,
 check_in_at=CASE WHEN $4 THEN clock_timestamp() WHEN $7 THEN NULL ELSE check_in_at END,
 called_at=CASE WHEN $5 THEN clock_timestamp() WHEN $7 THEN NULL ELSE called_at END,
 completed_at=CASE WHEN $6 THEN clock_timestamp() WHEN $7 THEN NULL ELSE completed_at END
 WHERE clinic_id=$1 AND id=$2 RETURNING `+appointmentColumns, clinicID, id, status, change.CheckIn, change.Called, change.Completed, change.Reset))
	if err != nil {
		return a, err
	}
	return a, tx.Commit(ctx)
}

func (r *Repository) ListQueue(ctx context.Context, clinicID, professionalID int64, date time.Time) ([]models.Appointment, error) {
	rows, err := r.Pool.Query(ctx, "SELECT "+appointmentColumns+` FROM appointments
 WHERE clinic_id=$1 AND ($2::bigint=0 OR professional_id=$2)
 AND status='chegou' AND start_time<$3 AND end_time>$4
 ORDER BY priority DESC,check_in_at,start_time,id`, clinicID, professionalID, date.AddDate(0, 0, 1), date)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, pgx.RowToStructByName[models.Appointment])
}

func (r *Repository) QueuePatients(ctx context.Context, clinicID, professionalID int64, date time.Time) ([]models.QueuePatient, error) {
	result := make([]models.QueuePatient, 0)
	rows, err := r.Pool.Query(ctx, `SELECT to_jsonb(a),c.name,c.phone FROM appointments a
 JOIN clients c ON c.id=a.client_id AND c.clinic_id=a.clinic_id
 WHERE a.clinic_id=$1 AND a.professional_id=$2 AND a.status IN ('chegou','agendado','confirmado')
 AND a.start_time<$3 AND a.end_time>$4
 ORDER BY a.priority DESC,a.check_in_at NULLS LAST,a.start_time,a.id`, clinicID, professionalID, date.AddDate(0, 0, 1), date)
	if err != nil {
		return result, err
	}
	defer rows.Close()
	for rows.Next() {
		var patient models.QueuePatient
		if err := rows.Scan(&patient.Appointment, &patient.ClientName, &patient.ClientPhone); err != nil {
			return result, err
		}
		result = append(result, patient)
	}
	return result, rows.Err()
}
