package handlers

import (
	"agendamento-clinica/backend/internal/models"
	"agendamento-clinica/backend/internal/repository"
	"agendamento-clinica/backend/internal/services"
	"context"
	"encoding/json"
	"errors"
	"github.com/jackc/pgx/v5/pgconn"
	"io"
	"log"
	"mime"
	"net/http"
	"net/mail"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

type Handler struct {
	Repo                  *repository.Repository
	Appointments          *services.Appointments
	WhatsAppWebhookSecret string
	EvolutionInstance     string
}

func (h *Handler) Routes() http.Handler {
	if h.Appointments == nil {
		h.Appointments = &services.Appointments{Repository: h.Repo}
	}
	mux := http.NewServeMux()
	for _, prefix := range []string{"", "/api"} {
		mux.HandleFunc("POST "+prefix+"/clinics", h.CreateClinic)
		mux.HandleFunc("GET "+prefix+"/clinics", h.ListClinics)
		mux.HandleFunc("POST "+prefix+"/professionals", h.CreateProfessional)
		mux.HandleFunc("GET "+prefix+"/professionals", h.ListProfessionals)
		mux.HandleFunc("POST "+prefix+"/clients", h.CreateClient)
		mux.HandleFunc("GET "+prefix+"/clients", h.ListClients)
		mux.HandleFunc("POST "+prefix+"/appointments", h.CreateAppointment)
		mux.HandleFunc("GET "+prefix+"/appointments", h.ListAppointments)
		mux.HandleFunc("GET "+prefix+"/appointments/queue", h.ListQueue)
		mux.HandleFunc("GET "+prefix+"/queue", h.DailyQueue)
		mux.HandleFunc("POST "+prefix+"/webhook/whatsapp", h.WhatsAppWebhook)
		mux.HandleFunc("PATCH "+prefix+"/appointments/{id}/check-in", h.AppointmentAction("chegou"))
		mux.HandleFunc("PATCH "+prefix+"/appointments/{id}/call", h.AppointmentAction("em_atendimento"))
		mux.HandleFunc("PATCH "+prefix+"/appointments/{id}/complete", h.AppointmentAction("concluido"))
		mux.HandleFunc("PATCH "+prefix+"/appointments/{id}/status", h.UpdateAppointmentStatus)
	}
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()
		if err := h.Repo.Pool.Ping(ctx); err != nil {
			writeJSON(w, 503, map[string]string{"error": "banco indisponível"})
			return
		}
		writeJSON(w, 200, map[string]string{"status": "ok"})
	})
	return mux
}

func decode(w http.ResponseWriter, r *http.Request, v any) bool {
	mediaType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || mediaType != "application/json" {
		writeJSON(w, 415, map[string]string{"error": "use Content-Type: application/json"})
		return false
	}
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	d := json.NewDecoder(r.Body)
	d.DisallowUnknownFields()
	if err := d.Decode(v); err != nil {
		writeJSON(w, 400, map[string]string{"error": "JSON inválido ou campos desconhecidos"})
		return false
	}
	if err := d.Decode(new(any)); err != io.EOF {
		writeJSON(w, 400, map[string]string{"error": "envie apenas um objeto JSON"})
		return false
	}
	return true
}
func textOK(s string, max int) bool {
	return strings.TrimSpace(s) != "" && utf8.RuneCountInString(s) <= max
}
func valid(name, email, detail string, maxDetail int) bool {
	a, err := mail.ParseAddress(email)
	return textOK(name, 120) && len(email) <= 254 && err == nil && a.Address == email && textOK(detail, maxDetail)
}
func badInput(w http.ResponseWriter, message string) {
	writeJSON(w, 400, map[string]string{"error": message})
}
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("resposta JSON: %v", err)
	}
}
func databaseError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, services.ErrTransition):
		writeJSON(w, 409, map[string]string{"error": err.Error()})
		return
	case errors.Is(err, services.ErrConflict):
		writeJSON(w, 409, map[string]string{"error": err.Error()})
		return
	case errors.Is(err, services.ErrOutsideHours):
		writeJSON(w, 422, map[string]string{"error": err.Error()})
		return
	case errors.Is(err, repository.ErrNotFound):
		writeJSON(w, 404, map[string]string{"error": err.Error()})
		return
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505":
			writeJSON(w, 409, map[string]string{"error": "cadastro duplicado"})
			return
		case "23503":
			badInput(w, "clínica, profissional ou paciente inexistente/incompatível")
			return
		case "23514", "22007", "22008":
			badInput(w, "dados inválidos")
			return
		}
	}
	log.Printf("operação no banco: %v", err)
	writeJSON(w, 500, map[string]string{"error": "não foi possível concluir a operação"})
}
func positiveID(w http.ResponseWriter, value, name string) (int64, bool) {
	id, err := strconv.ParseInt(value, 10, 64)
	if err != nil || id <= 0 {
		badInput(w, name+" deve ser um inteiro positivo")
		return 0, false
	}
	return id, true
}
func (h *Handler) CreateClinic(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name    string
		CNPJ    string
		Address string
	}
	if !decode(w, r, &input) {
		return
	}
	c := models.Clinic{Name: strings.TrimSpace(input.Name), CNPJ: input.CNPJ, Address: strings.TrimSpace(input.Address)}
	if !textOK(c.Name, 120) || !textOK(c.Address, 500) || !validCNPJ(c.CNPJ) {
		badInput(w, "name, address e CNPJ numérico válido são obrigatórios")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	c, err := h.Repo.CreateClinic(ctx, c)
	if err != nil {
		databaseError(w, err)
		return
	}
	writeJSON(w, 201, c)
}
func validCNPJ(s string) bool {
	if len(s) != 14 || s == strings.Repeat(s[:1], 14) {
		return false
	}
	for _, c := range s {
		if c < '0' || c > '9' {
			return false
		}
	}
	for n := 12; n <= 13; n++ {
		sum, weight := 0, n-7
		for i := 0; i < n; i++ {
			sum += int(s[i]-'0') * weight
			weight--
			if weight < 2 {
				weight = 9
			}
		}
		digit := 11 - sum%11
		if digit >= 10 {
			digit = 0
		}
		if digit != int(s[n]-'0') {
			return false
		}
	}
	return true
}
func (h *Handler) ListClinics(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	rows, err := h.Repo.ListClinics(ctx)
	if err != nil {
		databaseError(w, err)
		return
	}
	writeJSON(w, 200, rows)
}
func (h *Handler) CreateProfessional(w http.ResponseWriter, r *http.Request) {
	var input struct {
		ClinicID     int64                 `json:"clinic_id"`
		Name         string                `json:"name"`
		Specialty    string                `json:"specialty"`
		Availability []models.Availability `json:"availability"`
	}
	if !decode(w, r, &input) {
		return
	}
	p := models.Professional{ClinicID: input.ClinicID, Name: strings.TrimSpace(input.Name), Specialty: strings.TrimSpace(input.Specialty), Availability: input.Availability}
	if p.ClinicID <= 0 || !textOK(p.Name, 120) || !textOK(p.Specialty, 120) || !services.ValidAvailability(p.Availability) {
		badInput(w, "clinic_id, name, specialty e intervalos de expediente válidos são necessários")
		return
	}
	if p.Availability == nil {
		p.Availability = []models.Availability{}
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	p, err := h.Repo.CreateProfessional(ctx, p)
	if err != nil {
		databaseError(w, err)
		return
	}
	writeJSON(w, 201, p)
}
func (h *Handler) ListProfessionals(w http.ResponseWriter, r *http.Request) {
	clinicID, ok := positiveID(w, r.URL.Query().Get("clinic_id"), "clinic_id")
	if !ok {
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	rows, err := h.Repo.ListProfessionals(ctx, clinicID)
	if err != nil {
		databaseError(w, err)
		return
	}
	writeJSON(w, 200, rows)
}
func (h *Handler) CreateClient(w http.ResponseWriter, r *http.Request) {
	var input struct {
		ClinicID  int64  `json:"clinic_id"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
		BirthDate string `json:"birth_date"`
	}
	if !decode(w, r, &input) {
		return
	}
	c := models.Client{ClinicID: input.ClinicID, Name: strings.TrimSpace(input.Name), Email: strings.ToLower(strings.TrimSpace(input.Email)), Phone: strings.TrimSpace(input.Phone), BirthDate: input.BirthDate}
	birth, err := time.Parse("2006-01-02", c.BirthDate)
	if c.ClinicID <= 0 || !valid(c.Name, c.Email, c.Phone, 30) || err != nil || birth.Year() < 1 || c.BirthDate > time.Now().Format("2006-01-02") {
		badInput(w, "clinic_id, name, email, phone e birth_date (YYYY-MM-DD, sem data futura) são necessários")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	c, err = h.Repo.CreateClient(ctx, c)
	if err != nil {
		databaseError(w, err)
		return
	}
	writeJSON(w, 201, c)
}
func (h *Handler) ListClients(w http.ResponseWriter, r *http.Request) {
	clinicID, ok := positiveID(w, r.URL.Query().Get("clinic_id"), "clinic_id")
	if !ok {
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	rows, err := h.Repo.ListClients(ctx, clinicID)
	if err != nil {
		databaseError(w, err)
		return
	}
	writeJSON(w, 200, rows)
}
