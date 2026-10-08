package handlers

import (
	"agendamento-clinica/backend/internal/repository"
	"agendamento-clinica/backend/internal/services"
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"time"
)

// Replies must quote the outbound reminder to identify the correct appointment.
func (h *Handler) WhatsAppWebhook(w http.ResponseWriter, r *http.Request) {
	if h.WhatsAppWebhookSecret == "" {
		writeJSON(w, 503, map[string]string{"error": "webhook não configurado"})
		return
	}
	if subtle.ConstantTimeCompare([]byte(r.Header.Get("X-Webhook-Token")), []byte(h.WhatsAppWebhookSecret)) != 1 {
		writeJSON(w, 401, map[string]string{"error": "webhook não autorizado"})
		return
	}
	var input struct {
		Event    string `json:"event"`
		Instance string `json:"instance"`
		Data     struct {
			Key struct {
				RemoteJID string `json:"remoteJid"`
				FromMe    bool   `json:"fromMe"`
			} `json:"key"`
			Message struct {
				Extended struct {
					Text    string `json:"text"`
					Context struct {
						StanzaID string `json:"stanzaId"`
					} `json:"contextInfo"`
				} `json:"extendedTextMessage"`
			} `json:"message"`
		} `json:"data"`
	}
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	if err := decoder.Decode(&input); err != nil {
		badInput(w, "JSON inválido")
		return
	}
	if err := decoder.Decode(new(any)); err != io.EOF {
		badInput(w, "apenas um JSON permitido")
		return
	}
	message := strings.TrimSpace(input.Data.Message.Extended.Text)
	quoted := input.Data.Message.Extended.Context.StanzaID
	if h.EvolutionInstance == "" || input.Instance != h.EvolutionInstance {
		writeJSON(w, 403, map[string]string{"error": "instância não autorizada"})
		return
	}
	if input.Event != "messages.upsert" || input.Data.Key.FromMe || !strings.HasSuffix(input.Data.Key.RemoteJID, "@s.whatsapp.net") || quoted == "" || (message != "1" && message != "2") {
		writeJSON(w, 200, map[string]string{"result": "ignored"})
		return
	}
	phone := "+" + strings.TrimSuffix(input.Data.Key.RemoteJID, "@s.whatsapp.net")
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	a, err := h.Appointments.WhatsAppReply(ctx, quoted, phone, message)
	if errors.Is(err, services.ErrTransition) || errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, 200, map[string]string{"result": "ignored", "reason": "agendamento já avançou para outro status"})
		return
	}
	if err != nil {
		databaseError(w, err)
		return
	}
	writeJSON(w, 200, a)
}
