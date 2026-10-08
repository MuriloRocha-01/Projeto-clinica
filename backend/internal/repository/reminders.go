package repository

import (
	"agendamento-clinica/backend/internal/models"
	"context"
	"errors"
	"github.com/jackc/pgx/v5"
	"time"
)

// A single statement claims rows; parallel processes skip each other's locks.
func (r *Repository) ClaimReminders(ctx context.Context, from, to, now time.Time, token string, limit int) ([]models.Reminder, error) {
	rows, err := r.Pool.Query(ctx, `WITH candidates AS (
 SELECT id FROM appointments WHERE status='agendado' AND NOT reminder_sent
 AND start_time >= $1 AND start_time < $2 AND reminder_attempts<5
 AND (reminder_claim_until IS NULL OR reminder_claim_until<$3)
 AND (reminder_next_attempt_at IS NULL OR reminder_next_attempt_at<=$3)
 ORDER BY start_time,id LIMIT $5 FOR UPDATE SKIP LOCKED
 ), claimed AS (
 UPDATE appointments a SET reminder_claim_token=$4,reminder_claim_until=$3::timestamptz+interval '10 minutes',
 reminder_attempts=reminder_attempts+1 FROM candidates c WHERE a.id=c.id
 RETURNING a.id,a.clinic_id,a.client_id,a.start_time,a.reminder_attempts,a.reminder_claim_token
 ) SELECT a.id,a.clinic_id,a.start_time,c.name AS client_name,c.phone,k.name AS clinic_name,
 a.reminder_attempts AS attempts,a.reminder_claim_token AS claim_token FROM claimed a
 JOIN clients c ON c.id=a.client_id AND c.clinic_id=a.clinic_id JOIN clinics k ON k.id=a.clinic_id`, from, to, now, token, limit)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, pgx.RowToStructByName[models.Reminder])
}

func (r *Repository) ReminderEligible(ctx context.Context, job models.Reminder) (bool, error) {
	var eligible bool
	err := r.Pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM appointments WHERE id=$1 AND reminder_claim_token=$2
 AND reminder_claim_until>clock_timestamp() AND status='agendado' AND NOT reminder_sent AND start_time>clock_timestamp())`, job.ID, job.ClaimToken).Scan(&eligible)
	return eligible, err
}

func (r *Repository) FinishReminder(ctx context.Context, job models.Reminder, sent bool, messageID string, nextAttempt time.Time) error {
	_, err := r.Pool.Exec(ctx, `UPDATE appointments SET reminder_sent=$3,
 reminder_message_id=CASE WHEN $3 THEN $5 ELSE reminder_message_id END, reminder_sent_at=CASE WHEN $3 THEN clock_timestamp() ELSE reminder_sent_at END,
 reminder_next_attempt_at=CASE WHEN $3 THEN NULL ELSE $4::timestamptz END,
 reminder_claim_token=NULL,reminder_claim_until=NULL WHERE id=$1 AND reminder_claim_token=$2`, job.ID, job.ClaimToken, sent, nextAttempt, messageID)
	return err
}

func (r *Repository) WebhookAppointment(ctx context.Context, messageID string) (int64, int64, string, bool, error) {
	var id, clinicID int64
	var phone string
	var sent bool
	err := r.Pool.QueryRow(ctx, `SELECT a.id,a.clinic_id,c.phone,a.reminder_sent FROM appointments a
 JOIN clients c ON c.id=a.client_id AND c.clinic_id=a.clinic_id WHERE a.reminder_message_id=$1`, messageID).Scan(&id, &clinicID, &phone, &sent)
	if errors.Is(err, pgx.ErrNoRows) {
		err = ErrNotFound
	}
	return id, clinicID, phone, sent, err
}
