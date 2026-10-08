package notifications

import (
	"agendamento-clinica/backend/internal/models"
	"agendamento-clinica/backend/internal/services"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type HTTPGateway struct {
	URL, Token, Instance string
	Client               *http.Client
	Location             *time.Location
}

func (g *HTTPGateway) Send(ctx context.Context, job models.Reminder) (string, error) {
	phone, err := services.WhatsAppPhone(job.Phone)
	if err != nil {
		return "", err
	}
	payload := struct {
		Phone   string `json:"number"`
		Message string `json:"text"`
	}{
		Phone:   phone,
		Message: fmt.Sprintf("Olá, %s! Lembrete da consulta em %s no dia %s. Use Responder nesta mensagem: 1 para confirmar ou 2 para cancelar.", job.ClientName, job.ClinicName, job.StartTime.In(g.Location).Format("02/01/2006 às 15:04")),
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, strings.TrimRight(g.URL, "/")+"/message/sendText/"+url.PathEscape(g.Instance), bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("configuração do gateway inválida")
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("apikey", g.Token)
	response, err := g.Client.Do(request)
	if err != nil {
		return "", fmt.Errorf("gateway indisponível ou timeout")
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return "", fmt.Errorf("gateway respondeu HTTP %d", response.StatusCode)
	}
	var result struct {
		Key struct {
			ID string `json:"id"`
		} `json:"key"`
	}
	if err := json.NewDecoder(io.LimitReader(response.Body, 1<<20)).Decode(&result); err != nil || result.Key.ID == "" {
		return "", fmt.Errorf("Evolution retornou resposta sem key.id válido")
	}
	return result.Key.ID, nil
}
