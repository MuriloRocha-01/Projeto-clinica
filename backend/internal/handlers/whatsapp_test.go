package handlers

import (
	"net/http/httptest"
	"strings"
	"testing"
)

func TestEvolutionWebhookFiltering(t *testing.T) {
	h := &Handler{WhatsAppWebhookSecret: "secret", EvolutionInstance: "clinica"}
	for _, tc := range []struct {
		name, body, token string
		status            int
	}{
		{"unauthorized", `{}`, "wrong", 401},
		{"malformed", `{`, "secret", 400},
		{"wrong instance", `{"instance":"other"}`, "secret", 403},
		{"unquoted reply", `{"event":"messages.upsert","instance":"clinica","data":{"key":{"remoteJid":"5511999999999@s.whatsapp.net"},"message":{"conversation":"1"}}}`, "secret", 200},
		{"outbound ignored", `{"event":"messages.upsert","instance":"clinica","data":{"key":{"fromMe":true}}}`, "secret", 200},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r := httptest.NewRequest("POST", "/webhook/whatsapp", strings.NewReader(tc.body))
			r.Header.Set("X-Webhook-Token", tc.token)
			w := httptest.NewRecorder()
			h.WhatsAppWebhook(w, r)
			if w.Code != tc.status {
				t.Fatalf("status %d: %s", w.Code, w.Body)
			}
		})
	}
}
