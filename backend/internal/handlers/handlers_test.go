package handlers

import (
	"github.com/jackc/pgx/v5/pgconn"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestRejectInvalidRequests(t *testing.T) {
	h := &Handler{}
	for _, route := range []string{"/clinics", "/professionals", "/clients", "/appointments", "/api/appointments", "/api/professionals", "/api/clients"} {
		for _, tc := range []struct {
			body, contentType string
			status            int
		}{
			{`{}`, "application/json", 400},
			{`null`, "application/json", 400},
			{`{"name":"Ana","email":"invalid","specialty":"Cardiologia","phone":"123"}`, "application/json", 400},
			{`{"unknown":true}`, "application/json", 400},
			{`{} {}`, "application/json", 400},
			{`{`, "application/json", 400},
			{`{}`, "text/plain", 415},
			{strings.Repeat(" ", 1<<20) + `{}`, "application/json", 400},
		} {
			r := httptest.NewRequest("POST", route, strings.NewReader(tc.body))
			r.Header.Set("Content-Type", tc.contentType)
			w := httptest.NewRecorder()
			h.Routes().ServeHTTP(w, r)
			if w.Code != tc.status {
				t.Fatalf("%s: got %d, want %d", route, w.Code, tc.status)
			}
		}
	}
}

func TestValidationAndConflict(t *testing.T) {
	if !valid("Ana", "ana@example.com", "Cardiologia", 120) {
		t.Fatal("valid input rejected")
	}
	for _, email := range []string{"invalid", "Ana <ana@example.com>", ""} {
		if valid("Ana", email, "Cardiologia", 120) {
			t.Errorf("accepted invalid email %q", email)
		}
	}
	if valid(strings.Repeat("á", 121), "ana@example.com", "Cardiologia", 120) {
		t.Fatal("accepted long name")
	}
	w := httptest.NewRecorder()
	databaseError(w, &pgconn.PgError{Code: "23505"})
	if w.Code != 409 {
		t.Fatalf("got %d, want 409", w.Code)
	}
}

func TestAppointmentPriorityMessage(t *testing.T) {
	routes := (&Handler{}).Routes()
	for _, priority := range []string{"-1", "101"} {
		body := `{"clinic_id":1,"professional_id":1,"client_id":1,"start_time":"2026-10-08T09:00:00-03:00","end_time":"2026-10-08T10:00:00-03:00","priority":` + priority + `}`
		r := httptest.NewRequest("POST", "/appointments", strings.NewReader(body))
		r.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		routes.ServeHTTP(w, r)
		if w.Code != 400 || !strings.Contains(w.Body.String(), "priority") {
			t.Fatalf("invalid priority: %d %s", w.Code, w.Body)
		}
	}
}
