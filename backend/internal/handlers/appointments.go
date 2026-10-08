package handlers

import (
	"agendamento-clinica/backend/internal/models"
	"agendamento-clinica/backend/internal/services"
	"context"
	"net/http"
	"time"
)

func (h *Handler) CreateAppointment(w http.ResponseWriter, r *http.Request) {
	var input struct {
		ClinicID       int64     `json:"clinic_id"`
		ProfessionalID int64     `json:"professional_id"`
		ClientID       int64     `json:"client_id"`
		StartTime      time.Time `json:"start_time"`
		EndTime        time.Time `json:"end_time"`
		Notes          *string   `json:"notes"`
		Priority       int       `json:"priority"`
	}
	if !decode(w, r, &input) {
		return
	}
	if input.Priority < 0 || input.Priority > 100 {
		badInput(w, "priority deve estar entre 0 e 100")
		return
	}
	if input.ClinicID <= 0 || input.ProfessionalID <= 0 || input.ClientID <= 0 || input.StartTime.IsZero() || input.EndTime.IsZero() || !input.EndTime.After(input.StartTime) || input.StartTime.Year() < 1 || input.EndTime.Year() > 9999 {
		badInput(w, "IDs positivos e start_time/end_time em RFC3339 com término após início são obrigatórios")
		return
	}
	a := models.Appointment{ClinicID: input.ClinicID, ProfessionalID: input.ProfessionalID, ClientID: input.ClientID, StartTime: input.StartTime, EndTime: input.EndTime, Notes: input.Notes, Priority: input.Priority}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	a, err := h.Appointments.Create(ctx, a)
	if err != nil {
		databaseError(w, err)
		return
	}
	writeJSON(w, 201, a)
}

func (h *Handler) ListAppointments(w http.ResponseWriter, r *http.Request) {
	var clinicID int64
	if value := r.URL.Query().Get("clinic_id"); value != "" {
		var ok bool
		clinicID, ok = positiveID(w, value, "clinic_id")
		if !ok {
			return
		}
	}
	professionalID, ok := positiveID(w, r.URL.Query().Get("professional_id"), "professional_id")
	if !ok {
		return
	}
	date, err := time.ParseInLocation("2006-01-02", r.URL.Query().Get("date"), h.Repo.Location)
	if err != nil || date.Year() < 1 || date.Year() > 9999 {
		badInput(w, "date deve ser YYYY-MM-DD")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	if clinicID == 0 {
		clinicID, err = h.Repo.ProfessionalClinic(ctx, professionalID)
		if err != nil {
			databaseError(w, err)
			return
		}
	}
	rows, err := h.Repo.ListAppointments(ctx, clinicID, professionalID, date)
	if err != nil {
		databaseError(w, err)
		return
	}
	writeJSON(w, 200, rows)
}

func (h *Handler) UpdateAppointmentStatus(w http.ResponseWriter, r *http.Request) {
	id, ok := positiveID(w, r.PathValue("id"), "id")
	if !ok {
		return
	}
	var input struct {
		ClinicID int64  `json:"clinic_id"`
		Status   string `json:"status"`
	}
	if !decode(w, r, &input) {
		return
	}
	if input.ClinicID < 0 {
		badInput(w, "clinic_id deve ser positivo quando informado")
		return
	}
	input.Status = services.CanonicalAppointmentStatus(input.Status)
	if !services.ValidAppointmentStatus(input.Status) {
		badInput(w, "status inválido")
		return
	}
	h.transitionStatus(w, r, id, input.ClinicID, input.Status)
}

func (h *Handler) transitionStatus(w http.ResponseWriter, r *http.Request, id, clinicID int64, status string) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	if clinicID == 0 {
		resolvedClinic, err := h.Repo.AppointmentClinic(ctx, id)
		if err != nil {
			databaseError(w, err)
			return
		}
		clinicID = resolvedClinic
	}
	a, err := h.Appointments.UpdateStatus(ctx, clinicID, id, status)
	if err != nil {
		databaseError(w, err)
		return
	}
	writeJSON(w, 200, a)
}

func (h *Handler) AppointmentAction(status string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id, ok := positiveID(w, r.PathValue("id"), "id")
		if !ok {
			return
		}
		var clinicID int64
		if value := r.URL.Query().Get("clinic_id"); value != "" {
			clinicID, ok = positiveID(w, value, "clinic_id")
			if !ok {
				return
			}
		}
		h.transitionStatus(w, r, id, clinicID, status)
	}
}

func (h *Handler) DailyQueue(w http.ResponseWriter, r *http.Request) {
	professionalID, ok := positiveID(w, r.URL.Query().Get("professional_id"), "professional_id")
	if !ok {
		return
	}
	dateValue := r.URL.Query().Get("date")
	if dateValue == "" {
		dateValue = time.Now().In(h.Repo.Location).Format("2006-01-02")
	}
	date, err := time.ParseInLocation("2006-01-02", dateValue, h.Repo.Location)
	if err != nil || date.Year() < 1 {
		badInput(w, "date deve ser YYYY-MM-DD")
		return
	}
	var clinicID int64
	if value := r.URL.Query().Get("clinic_id"); value != "" {
		clinicID, ok = positiveID(w, value, "clinic_id")
		if !ok {
			return
		}
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	actualClinic, err := h.Repo.ProfessionalClinic(ctx, professionalID)
	if err != nil {
		databaseError(w, err)
		return
	}
	if clinicID != 0 && clinicID != actualClinic {
		writeJSON(w, 404, map[string]string{"error": "profissional não encontrado na clínica"})
		return
	}
	result, err := h.Appointments.DailyQueue(ctx, actualClinic, professionalID, date)
	if err != nil {
		databaseError(w, err)
		return
	}
	writeJSON(w, 200, result)
}

func (h *Handler) ListQueue(w http.ResponseWriter, r *http.Request) {
	clinicID, ok := positiveID(w, r.URL.Query().Get("clinic_id"), "clinic_id")
	if !ok {
		return
	}
	var professionalID int64
	if value := r.URL.Query().Get("professional_id"); value != "" {
		professionalID, ok = positiveID(w, value, "professional_id")
		if !ok {
			return
		}
	}
	dateValue := r.URL.Query().Get("date")
	if dateValue == "" {
		dateValue = time.Now().In(h.Repo.Location).Format("2006-01-02")
	}
	date, err := time.ParseInLocation("2006-01-02", dateValue, h.Repo.Location)
	if err != nil || date.Year() < 1 {
		badInput(w, "date deve ser YYYY-MM-DD")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	if professionalID != 0 {
		actualClinic, err := h.Repo.ProfessionalClinic(ctx, professionalID)
		if err != nil {
			databaseError(w, err)
			return
		}
		if actualClinic != clinicID {
			writeJSON(w, 404, map[string]string{"error": "profissional não encontrado na clínica"})
			return
		}
	}
	rows, err := h.Repo.ListQueue(ctx, clinicID, professionalID, date)
	if err != nil {
		databaseError(w, err)
		return
	}
	writeJSON(w, 200, rows)
}
