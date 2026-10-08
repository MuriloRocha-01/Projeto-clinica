package services

import (
	"agendamento-clinica/backend/internal/models"
	"agendamento-clinica/backend/internal/repository"
	"context"
	"errors"
	"time"
)

var (
	ErrConflict     = errors.New("horário já ocupado")
	ErrOutsideHours = errors.New("agendamento fora do expediente")
	ErrTransition   = errors.New("transição de status não permitida")
)

type Appointments struct{ Repository *repository.Repository }

func (s *Appointments) Create(ctx context.Context, a models.Appointment) (models.Appointment, error) {
	return s.Repository.CreateAppointment(ctx, a, func(slots []models.Availability, conflict bool) error {
		if !WithinHours(a.StartTime, a.EndTime, slots, s.Repository.Location) {
			return ErrOutsideHours
		}
		if conflict {
			return ErrConflict
		}
		return nil
	})
}

func (s *Appointments) UpdateStatus(ctx context.Context, clinicID, id int64, status string) (models.Appointment, error) {
	return s.Repository.UpdateAppointmentStatus(ctx, clinicID, id, status, func(current models.Appointment, slots []models.Availability, conflict bool) (repository.StatusChange, error) {
		if !CanTransition(current.Status, status) {
			return repository.StatusChange{}, ErrTransition
		}
		if current.Status != status && status != "cancelado" {
			if current.Status == "cancelado" && !WithinHours(current.StartTime, current.EndTime, slots, s.Repository.Location) {
				return repository.StatusChange{}, ErrOutsideHours
			}
			if conflict {
				return repository.StatusChange{}, ErrConflict
			}
		}
		return repository.StatusChange{CheckIn: status == "chegou", Called: status == "em_atendimento", Completed: status == "concluido", Reset: status == "agendado"}, nil
	})
}

func (s *Appointments) DailyQueue(ctx context.Context, clinicID, professionalID int64, date time.Time) (models.DailyQueue, error) {
	result := models.DailyQueue{Arrived: []models.QueuePatient{}, Upcoming: []models.QueuePatient{}}
	patients, err := s.Repository.QueuePatients(ctx, clinicID, professionalID, date)
	if err != nil {
		return result, err
	}
	for _, patient := range patients {
		if patient.Status == "chegou" {
			result.Arrived = append(result.Arrived, patient)
		} else {
			result.Upcoming = append(result.Upcoming, patient)
		}
	}
	return result, nil
}
