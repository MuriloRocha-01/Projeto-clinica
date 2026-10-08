package notifications

import (
	"agendamento-clinica/backend/internal/models"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestEvolutionSend(t *testing.T) {
	for _, tc := range []struct {
		name, body string
		status     int
		wantError  bool
	}{
		{"success", `{"key":{"id":"sent-123"}}`, 201, false},
		{"missing id", `{}`, 201, true},
		{"gateway failure", `{}`, 503, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Method != "POST" || r.URL.Path != "/message/sendText/clinica" || r.Header.Get("apikey") != "test-secret" {
					t.Errorf("invalid Evolution request")
				}
				var body map[string]string
				if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
					t.Error(err)
				}
				if body["number"] != "5511999999999" || body["text"] == "" {
					t.Errorf("invalid payload: %v", body)
				}
				w.WriteHeader(tc.status)
				_, _ = w.Write([]byte(tc.body))
			}))
			defer server.Close()
			gateway := &HTTPGateway{URL: server.URL, Token: "test-secret", Instance: "clinica", Client: server.Client(), Location: time.UTC}
			id, err := gateway.Send(context.Background(), models.Reminder{Phone: "(11) 99999-9999", StartTime: time.Now()})
			if (err != nil) != tc.wantError {
				t.Fatalf("error=%v", err)
			}
			if !tc.wantError && id != "sent-123" {
				t.Fatalf("id=%s", id)
			}
		})
	}
}
