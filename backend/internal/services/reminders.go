package services

import (
	"agendamento-clinica/backend/internal/models"
	"agendamento-clinica/backend/internal/repository"
	"context"
	"crypto/rand"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"
)

type ReminderSender interface {
	Send(context.Context, models.Reminder) (string, error)
}

type Reminders struct {
	Repository  *repository.Repository
	Sender      ReminderSender
	Concurrency int
	Mode        string
	Interval    time.Duration
}

func (s *Reminders) Window(now time.Time) (time.Time, time.Time) {
	if s.Mode == "next_day" {
		local := now.In(s.Repository.Location)
		start := time.Date(local.Year(), local.Month(), local.Day()+1, 0, 0, 0, 0, s.Repository.Location)
		return start, start.AddDate(0, 0, 1)
	}
	return now, now.Add(2 * time.Hour)
}

func (s *Reminders) Run(ctx context.Context) {
	ticker := time.NewTicker(s.Interval)
	defer ticker.Stop()
	for {
		if ctx.Err() != nil {
			return
		}
		if err := s.RunOnce(ctx, time.Now()); err != nil && ctx.Err() == nil {
			log.Printf("buscar lembretes: %v", err)
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

func (s *Reminders) RunOnce(ctx context.Context, now time.Time) error {
	if s.Concurrency < 1 || s.Concurrency > 10 {
		return fmt.Errorf("concorrência deve estar entre 1 e 10")
	}
	from, to := s.Window(now)
	jobs, err := s.Repository.ClaimReminders(ctx, from, to, now, rand.Text(), s.Concurrency*10)
	if err != nil {
		return err
	}
	pending := make(chan models.Reminder)
	var workers sync.WaitGroup
	for i := 0; i < s.Concurrency; i++ {
		workers.Add(1)
		go func() {
			defer workers.Done()
			for job := range pending {
				if ctx.Err() != nil {
					return
				}
				if err := s.deliver(ctx, job); err != nil && ctx.Err() == nil {
					log.Printf("lembrete agendamento %d: %v", job.ID, err)
				}
			}
		}()
	}
	for _, job := range jobs {
		select {
		case pending <- job:
		case <-ctx.Done():
			close(pending)
			workers.Wait()
			return ctx.Err()
		}
	}
	close(pending)
	workers.Wait()
	return ctx.Err()
}

func (s *Reminders) deliver(ctx context.Context, job models.Reminder) error {
	eligible, err := s.Repository.ReminderEligible(ctx, job)
	if err != nil {
		return err
	}
	if !eligible {
		return s.Repository.FinishReminder(ctx, job, false, "", time.Now().Add(5*time.Minute))
	}
	messageID, sendErr := s.Sender.Send(ctx, job)
	nextAttempt := time.Now().Add(time.Duration(1<<uint(job.Attempts-1)) * 5 * time.Minute)
	if err := s.Repository.FinishReminder(ctx, job, sendErr == nil, messageID, nextAttempt); err != nil {
		return fmt.Errorf("registrar envio: %w", err)
	}
	return sendErr
}

func WhatsAppPhone(value string) (string, error) {
	value = strings.TrimSpace(value)
	international := strings.HasPrefix(value, "+")
	var digits strings.Builder
	for _, c := range value {
		switch {
		case c >= '0' && c <= '9':
			digits.WriteRune(c)
		case c == '+' || c == ' ' || c == '(' || c == ')' || c == '-':
		default:
			return "", fmt.Errorf("telefone inválido")
		}
	}
	phone := digits.String()
	if !international && (len(phone) == 10 || len(phone) == 11) {
		phone = "55" + phone
	}
	if len(phone) < 10 || len(phone) > 15 || phone[0] == '0' {
		return "", fmt.Errorf("telefone inválido")
	}
	return phone, nil
}

func (s *Appointments) WhatsAppReply(ctx context.Context, messageID, phone, message string) (models.Appointment, error) {
	if message != "1" && message != "2" {
		return models.Appointment{}, ErrTransition
	}
	id, clinicID, storedPhone, sent, err := s.Repository.WebhookAppointment(ctx, messageID)
	if err != nil {
		return models.Appointment{}, err
	}
	received, e1 := WhatsAppPhone(phone)
	stored, e2 := WhatsAppPhone(storedPhone)
	if e1 != nil || e2 != nil || received != stored || !sent {
		return models.Appointment{}, repository.ErrNotFound
	}
	status := "confirmado"
	if message == "2" {
		status = "cancelado"
	}
	return s.UpdateStatus(ctx, clinicID, id, status)
}
