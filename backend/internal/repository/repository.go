package repository

import (
	"agendamento-clinica/backend/internal/models"
	"context"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"time"
)

type Repository struct {
	Pool     *pgxpool.Pool
	Location *time.Location
}

func (r *Repository) CreateClinic(ctx context.Context, c models.Clinic) (models.Clinic, error) {
	err := r.Pool.QueryRow(ctx, "INSERT INTO clinics (name,cnpj,address) VALUES ($1,$2,$3) RETURNING id,created_at", c.Name, c.CNPJ, c.Address).Scan(&c.ID, &c.CreatedAt)
	return c, err
}
func (r *Repository) ListClinics(ctx context.Context) ([]models.Clinic, error) {
	rows, err := r.Pool.Query(ctx, "SELECT id,name,cnpj,address,created_at FROM clinics ORDER BY id")
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, pgx.RowToStructByName[models.Clinic])
}
func (r *Repository) CreateProfessional(ctx context.Context, p models.Professional) (models.Professional, error) {
	err := r.Pool.QueryRow(ctx, "INSERT INTO professionals (clinic_id,name,specialty,availability) VALUES ($1,$2,$3,$4) RETURNING id,created_at", p.ClinicID, p.Name, p.Specialty, p.Availability).Scan(&p.ID, &p.CreatedAt)
	return p, err
}
func (r *Repository) ListProfessionals(ctx context.Context, clinicID int64) ([]models.Professional, error) {
	rows, err := r.Pool.Query(ctx, "SELECT id,clinic_id,name,specialty,availability,created_at FROM professionals WHERE clinic_id=$1 ORDER BY id", clinicID)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, pgx.RowToStructByName[models.Professional])
}
func (r *Repository) CreateClient(ctx context.Context, c models.Client) (models.Client, error) {
	err := r.Pool.QueryRow(ctx, "INSERT INTO clients (clinic_id,name,email,phone,birth_date) VALUES ($1,$2,$3,$4,$5::date) RETURNING id,created_at", c.ClinicID, c.Name, c.Email, c.Phone, c.BirthDate).Scan(&c.ID, &c.CreatedAt)
	return c, err
}
func (r *Repository) ListClients(ctx context.Context, clinicID int64) ([]models.Client, error) {
	rows, err := r.Pool.Query(ctx, "SELECT id,clinic_id,name,email,phone,birth_date::text AS birth_date,created_at FROM clients WHERE clinic_id=$1 ORDER BY id", clinicID)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, pgx.RowToStructByName[models.Client])
}
