package handlers

import (
	"agendamento-clinica/backend/internal/models"
	"agendamento-clinica/backend/internal/notifications"
	"agendamento-clinica/backend/internal/repository"
	"agendamento-clinica/backend/internal/services"
	"context"
	"encoding/json"
	"fmt"
	"github.com/jackc/pgx/v5/pgxpool"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestPostgresEndpoints(t *testing.T) {
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TEST_DATABASE_URL to run PostgreSQL integration test")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()
	admin, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	defer admin.Close()
	schema := fmt.Sprintf("test_api_%d", time.Now().UnixNano())
	if _, err = admin.Exec(ctx, "CREATE SCHEMA "+schema); err != nil {
		t.Fatal(err)
	}
	defer func() {
		cleanup, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if _, err := admin.Exec(cleanup, "DROP SCHEMA "+schema+" CASCADE"); err != nil {
			t.Errorf("cleanup: %v", err)
		}
	}()
	config, err := pgxpool.ParseConfig(url)
	if err != nil {
		t.Fatal(err)
	}
	config.ConnConfig.RuntimeParams["search_path"] = schema
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	sql, err := os.ReadFile(filepath.Join("..", "..", "schema.sql"))
	if err != nil {
		t.Fatal(err)
	}
	if _, err = pool.Exec(ctx, strings.ReplaceAll(string(sql), "public.", schema+".")); err != nil {
		t.Fatal(err)
	}
	loc, err := time.LoadLocation("America/Sao_Paulo")
	if err != nil {
		t.Fatal(err)
	}
	routes := (&Handler{Repo: &repository.Repository{Pool: pool, Location: loc}}).Routes()
	request := func(method, path, body string) *httptest.ResponseRecorder {
		r := httptest.NewRequest(method, path, strings.NewReader(body))
		r.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		routes.ServeHTTP(w, r)
		return w
	}
	expect := func(method, path, body string, status int) *httptest.ResponseRecorder {
		t.Helper()
		w := request(method, path, body)
		if w.Code != status {
			t.Fatalf("%s %s: got %d want %d: %s", method, path, w.Code, status, w.Body)
		}
		return w
	}
	expect("POST", "/clinics", `{"name":"Clínica Teste","cnpj":"11222333000181","address":"Rua Teste"}`, 201)
	expect("POST", "/clinics", `{"name":"Outra Clínica","cnpj":"11444777000161","address":"Rua Teste"}`, 201)
	expect("GET", "/clinics", "", 200)
	expect("GET", "/professionals?clinic_id=1", "", 200)
	expect("POST", "/professionals", `{"clinic_id":1,"name":" Ana ","specialty":"Cardiologia","availability":[{"weekday":4,"start":"09:00","end":"18:00"}]}`, 201)
	expect("GET", "/api/professionals?clinic_id=1", "", 200)
	for _, clinic := range []int{1, 2} {
		body := fmt.Sprintf(`{"clinic_id":%d,"name":" João ","email":"JOAO@example.com","phone":"11999999999","birth_date":"1990-01-01"}`, clinic)
		expect("POST", "/clients", body, 201)
		expect("POST", "/clients", body, 409)
	}
	expect("GET", "/api/clients?clinic_id=1", "", 200)
	body := func(start, end string, client int) string {
		return fmt.Sprintf(`{"clinic_id":1,"professional_id":1,"client_id":%d,"start_time":"%s","end_time":"%s","notes":"Teste"}`, client, start, end)
	}
	expect("POST", "/appointments", body("2026-10-08T09:00:00-03:00", "2026-10-08T10:00:00-03:00", 1), 201)
	// Simulate the previously deployed schema and verify the incremental update
	// preserves the booking while mapping legacy statuses to agendado.
	if _, err := pool.Exec(ctx, `ALTER TABLE appointments DROP CONSTRAINT appointments_status_check;
 UPDATE appointments SET status='confirmado';
 ALTER TABLE appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('pendente','confirmado','cancelado','concluido'));
 ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'pendente';
	 ALTER TABLE appointments DROP COLUMN check_in_at CASCADE, DROP COLUMN called_at CASCADE, DROP COLUMN completed_at CASCADE, DROP COLUMN priority;`); err != nil {
		t.Fatal(err)
	}
	workflowSQL, err := os.ReadFile(filepath.Join("..", "..", "sql", "appointment_workflow.sql"))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, strings.ReplaceAll(string(workflowSQL), "public.", schema+".")); err != nil {
		t.Fatal(err)
	}
	queueSQL, err := os.ReadFile(filepath.Join("..", "..", "sql", "queue_actions.sql"))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, strings.ReplaceAll(string(queueSQL), "public.", schema+".")); err != nil {
		t.Fatal(err)
	}
	var mappedStatus string
	if err := pool.QueryRow(ctx, "SELECT status FROM appointments WHERE id=1").Scan(&mappedStatus); err != nil || mappedStatus != "agendado" {
		t.Fatalf("legacy mapping: %s %v", mappedStatus, err)
	}
	for _, times := range [][2]string{{"08:30", "09:30"}, {"09:15", "09:45"}, {"09:30", "10:30"}, {"08:30", "10:30"}} {
		// Some overlaps also fall outside hours; valid overlaps must return 409.
		status := 409
		if times[0] < "09:00" {
			status = 422
		}
		expect("POST", "/appointments", body("2026-10-08T"+times[0]+":00-03:00", "2026-10-08T"+times[1]+":00-03:00", 1), status)
	}
	expect("POST", "/appointments", body("2026-10-08T10:00:00-03:00", "2026-10-08T11:00:00-03:00", 1), 201)
	expect("POST", "/appointments", body("2026-10-08T18:00:00-03:00", "2026-10-08T19:00:00-03:00", 1), 422)
	expect("POST", "/appointments", body("2026-10-09T09:00:00-03:00", "2026-10-09T10:00:00-03:00", 1), 422)
	expect("POST", "/appointments", body("2026-10-08T11:00:00-03:00", "2026-10-08T12:00:00-03:00", 2), 404)
	expect("POST", "/appointments", body("2026-10-08T10:00:00-03:00", "2026-10-08T09:00:00-03:00", 1), 400)
	expect("PATCH", "/appointments/1/status", `{"clinic_id":1,"status":"chegou"}`, 200)
	expect("PATCH", "/appointments/1/status", `{"clinic_id":1,"status":"cancelado"}`, 200)
	expect("POST", "/appointments", body("2026-10-08T12:00:00Z", "2026-10-08T13:00:00Z", 1), 201)
	expect("PATCH", "/appointments/1/status", `{"clinic_id":1,"status":"agendado"}`, 409)
	expect("PATCH", "/appointments/2/status", `{"clinic_id":2,"status":"concluido"}`, 404)
	expect("PATCH", "/appointments/999/status", `{"clinic_id":1,"status":"agendado"}`, 404)
	expect("PATCH", "/appointments/2/status", `{"clinic_id":1,"status":"invalid"}`, 400)
	expect("PATCH", "/appointments/2/status", `{"clinic_id":1,"status":"concluido"}`, 409)
	expect("PATCH", "/appointments/2/status", `{"status":"chegou"}`, 200)
	expect("PATCH", "/appointments/2/status", `{"status":"em_atendimento"}`, 200)
	expect("PATCH", "/appointments/2/status", `{"status":"concluido"}`, 200)
	expect("GET", "/appointments?clinic_id=1&professional_id=1&date=invalid", "", 400)
	expect("GET", "/appointments?clinic_id=2&professional_id=1&date=2026-10-08", "", 404)
	w := expect("GET", "/api/appointments?clinic_id=1&professional_id=1&date=2026-10-08", "", 200)
	var agenda []map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &agenda); err != nil || len(agenda) != 3 {
		t.Fatalf("agenda: %s, %v", w.Body, err)
	}
	w = expect("GET", "/appointments?clinic_id=1&professional_id=1&date=2026-10-09", "", 200)
	if strings.TrimSpace(w.Body.String()) != "[]" {
		t.Fatalf("empty agenda: %s", w.Body)
	}
	// Concurrent requests must yield exactly one success and one conflict.
	var wg sync.WaitGroup
	codes := make(chan int, 2)
	for i := 0; i < 2; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			codes <- request(http.MethodPost, "/appointments", body("2026-10-08T14:00:00-03:00", "2026-10-08T15:00:00-03:00", 1)).Code
		}()
	}
	wg.Wait()
	close(codes)
	counts := map[int]int{}
	for code := range codes {
		counts[code]++
	}
	if counts[201] != 1 || counts[409] != 1 {
		t.Fatalf("concurrent booking: %v", counts)
	}
	expect("GET", "/api/health", "", 200)
	expect("GET", "/appointments?professional_id=1&date=2026-10-08", "", 200)
	expect("PATCH", "/appointments/2/status", `{"status":"concluido"}`, 200)
	expect("PATCH", "/appointments/2/status", `{"status":"faltou"}`, 409)
	decodeAppointment := func(w *httptest.ResponseRecorder) models.Appointment {
		t.Helper()
		var a models.Appointment
		if err := json.Unmarshal(w.Body.Bytes(), &a); err != nil {
			t.Fatal(err)
		}
		return a
	}
	// Later appointment arrives first: FIFO must follow check-in, not booking time.
	first := decodeAppointment(expect("PATCH", "/appointments/4/status", `{"status":"chegou"}`, 200))
	second := decodeAppointment(expect("PATCH", "/appointments/3/status", `{"status":"chegou"}`, 200))
	if first.CheckInAt == nil || second.CheckInAt == nil || first.CalledAt != nil || first.CompletedAt != nil {
		t.Fatal("incorrect check-in timestamps")
	}
	repeated := decodeAppointment(expect("PATCH", "/appointments/4/status", `{"status":"chegou"}`, 200))
	if !first.CheckInAt.Equal(*repeated.CheckInAt) {
		t.Fatal("repeated check-in changed timestamp")
	}
	w = expect("GET", "/appointments/queue?clinic_id=1&date=2026-10-08", "", 200)
	var queue []models.Appointment
	if err := json.Unmarshal(w.Body.Bytes(), &queue); err != nil {
		t.Fatal(err)
	}
	if len(queue) != 2 || queue[0].ID != 4 || queue[1].ID != 3 {
		t.Fatalf("queue order: %v", queue)
	}
	expect("GET", "/appointments/queue?clinic_id=2&professional_id=1&date=2026-10-08", "", 404)
	w = expect("GET", "/appointments/queue?clinic_id=1&date=2026-10-09", "", 200)
	if strings.TrimSpace(w.Body.String()) != "[]" {
		t.Fatal("queue leaked across dates")
	}
	called := decodeAppointment(expect("PATCH", "/appointments/4/status", `{"status":"em_atendimento"}`, 200))
	if called.CalledAt == nil || called.CalledAt.Before(*called.CheckInAt) || called.CompletedAt != nil {
		t.Fatal("incorrect called_at")
	}
	w = expect("GET", "/api/appointments/queue?clinic_id=1&professional_id=1&date=2026-10-08", "", 200)
	if err := json.Unmarshal(w.Body.Bytes(), &queue); err != nil || len(queue) != 1 || queue[0].ID != 3 {
		t.Fatalf("called client remained in queue: %s", w.Body)
	}
	completed := decodeAppointment(expect("PATCH", "/appointments/4/status", `{"status":"concluido"}`, 200))
	if completed.CompletedAt == nil || completed.CompletedAt.Before(*completed.CalledAt) {
		t.Fatal("incorrect completed_at")
	}
	expect("PATCH", "/appointments/3/status", `{"status":"cancelado"}`, 200)
	expect("POST", "/appointments", body("2026-10-08T09:00:00-03:00", "2026-10-08T10:00:00-03:00", 1), 201)
	missed := decodeAppointment(expect("PATCH", "/appointments/5/status", `{"status":"faltou"}`, 200))
	if missed.CheckInAt != nil || missed.CalledAt != nil || missed.CompletedAt != nil {
		t.Fatal("no-show has attendance timestamps")
	}
	urgentBody := strings.TrimSuffix(body("2026-10-08T16:00:00-03:00", "2026-10-08T17:00:00-03:00", 1), "}") + `,"priority":10}`
	expect("POST", "/appointments", urgentBody, 201)
	expect("POST", "/appointments", body("2026-10-08T17:00:00-03:00", "2026-10-08T18:00:00-03:00", 1), 201)
	expect("POST", "/appointments", body("2026-10-08T11:00:00-03:00", "2026-10-08T12:00:00-03:00", 1), 201)
	expect("PATCH", "/appointments/8/call", "", 409)
	expect("PATCH", "/appointments/7/check-in", "", 200)
	urgent := decodeAppointment(expect("PATCH", "/api/appointments/6/check-in", "", 200))
	if urgent.Status != "chegou" || urgent.CheckInAt == nil || urgent.Priority != 10 {
		t.Fatalf("check-in: %v", urgent)
	}
	repeatUrgent := decodeAppointment(expect("PATCH", "/appointments/6/check-in", "", 200))
	if !urgent.CheckInAt.Equal(*repeatUrgent.CheckInAt) {
		t.Fatal("check-in action overwrote arrival")
	}
	w = expect("GET", "/queue?professional_id=1&date=2026-10-08", "", 200)
	var daily models.DailyQueue
	if err := json.Unmarshal(w.Body.Bytes(), &daily); err != nil {
		t.Fatal(err)
	}
	if len(daily.Arrived) != 2 || daily.Arrived[0].ID != 6 || daily.Arrived[1].ID != 7 || len(daily.Upcoming) != 1 || daily.Upcoming[0].ID != 8 || daily.Arrived[0].ClientName != "João" {
		t.Fatalf("daily queue: %s", w.Body)
	}
	expect("GET", "/queue?professional_id=1&clinic_id=2&date=2026-10-08", "", 404)
	w = expect("GET", "/api/queue?professional_id=1&date=2026-10-09", "", 200)
	if err := json.Unmarshal(w.Body.Bytes(), &daily); err != nil || len(daily.Arrived) != 0 || len(daily.Upcoming) != 0 {
		t.Fatalf("queue date leaked: %s", w.Body)
	}
	urgent = decodeAppointment(expect("PATCH", "/appointments/6/call", "", 200))
	if urgent.Status != "em_atendimento" || urgent.CalledAt == nil {
		t.Fatal("call action failed")
	}
	urgent = decodeAppointment(expect("PATCH", "/appointments/6/complete", "", 200))
	if urgent.Status != "concluido" || urgent.CompletedAt == nil {
		t.Fatal("complete action failed")
	}
	expect("PATCH", "/appointments/6/check-in", "", 409)
	expect("PATCH", "/appointments/999/check-in", "", 404)
	expect("PATCH", "/appointments/8/status", `{"status":"na_recepcao"}`, 200)
	// Exercise worker and Evolution replies using only this isolated test schema.
	if _, err := pool.Exec(ctx, `ALTER TABLE appointments DROP CONSTRAINT appointments_status_check;
 ALTER TABLE appointments ADD CONSTRAINT appointments_status_check CHECK(status IN ('agendado','confirmado','chegou','em_atendimento','concluido','faltou','cancelado'));
 INSERT INTO appointments(clinic_id,professional_id,client_id,start_time,end_time)
 VALUES(1,1,1,now()+interval '30 minutes',now()+interval '40 minutes')`); err != nil {
		t.Fatal(err)
	}
	gateway := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"key":{"id":"test-reminder"}}`))
	}))
	defer gateway.Close()
	repo := &repository.Repository{Pool: pool, Location: loc}
	worker := &services.Reminders{Repository: repo, Sender: &notifications.HTTPGateway{URL: gateway.URL, Instance: "clinica", Token: "test", Client: gateway.Client(), Location: loc}, Concurrency: 2, Mode: "two_hours"}
	if err := worker.RunOnce(ctx, time.Now()); err != nil {
		t.Fatal(err)
	}
	var sent bool
	var attempts int
	if err := pool.QueryRow(ctx, `SELECT reminder_sent,reminder_attempts FROM appointments WHERE reminder_message_id='test-reminder'`).Scan(&sent, &attempts); err != nil || !sent || attempts != 1 {
		t.Fatalf("worker result: %v sent=%v attempts=%d", err, sent, attempts)
	}
	if err := worker.RunOnce(ctx, time.Now()); err != nil {
		t.Fatal(err)
	}
	var phone string
	if err := pool.QueryRow(ctx, "SELECT phone FROM clients WHERE id=1").Scan(&phone); err != nil {
		t.Fatal(err)
	}
	phone, err = services.WhatsAppPhone(phone)
	if err != nil {
		t.Fatal(err)
	}
	webhook := &Handler{Repo: repo, Appointments: &services.Appointments{Repository: repo}, WhatsAppWebhookSecret: "test", EvolutionInstance: "clinica"}
	for _, reply := range []string{"1", "1", "2"} {
		payload := fmt.Sprintf(`{"event":"messages.upsert","instance":"clinica","data":{"key":{"remoteJid":"%s@s.whatsapp.net"},"message":{"extendedTextMessage":{"text":"%s","contextInfo":{"stanzaId":"test-reminder"}}}}}`, phone, reply)
		req := httptest.NewRequest("POST", "/webhook/whatsapp", strings.NewReader(payload))
		req.Header.Set("X-Webhook-Token", "test")
		response := httptest.NewRecorder()
		webhook.WhatsAppWebhook(response, req)
		if response.Code != 200 {
			t.Fatalf("webhook: %d %s", response.Code, response.Body)
		}
	}
	var status string
	if err := pool.QueryRow(ctx, `SELECT status FROM appointments WHERE reminder_message_id='test-reminder'`).Scan(&status); err != nil || status != "cancelado" {
		t.Fatalf("reply status=%s err=%v", status, err)
	}
}
