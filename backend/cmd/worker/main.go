package main

import (
	"agendamento-clinica/backend/internal/database"
	"agendamento-clinica/backend/internal/notifications"
	"agendamento-clinica/backend/internal/repository"
	"agendamento-clinica/backend/internal/services"
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	once := flag.Bool("once", false, "processar um lote e encerrar")
	flag.Parse()
	if os.Getenv("REMINDERS_ENABLED") != "true" {
		log.Print("worker desativado; configure o gateway e REMINDERS_ENABLED=true")
		return nil
	}
	gatewayURL, token := os.Getenv("EVOLUTION_API_URL"), os.Getenv("EVOLUTION_API_KEY")
	parsed, err := url.Parse(gatewayURL)
	if err != nil || parsed.Host == "" || (parsed.Scheme != "http" && parsed.Scheme != "https") || token == "" || os.Getenv("EVOLUTION_INSTANCE") == "" {
		return fmt.Errorf("configure EVOLUTION_API_URL e EVOLUTION_API_KEY")
	}
	if os.Getenv("WHATSAPP_WEBHOOK_SECRET") == "" {
		return fmt.Errorf("configure WHATSAPP_WEBHOOK_SECRET antes de habilitar os lembretes")
	}
	timezone := os.Getenv("APPOINTMENT_TIMEZONE")
	if timezone == "" {
		timezone = "America/Sao_Paulo"
	}
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		return err
	}
	concurrency := 4
	if value := os.Getenv("REMINDER_CONCURRENCY"); value != "" {
		concurrency, err = strconv.Atoi(value)
		if err != nil || concurrency < 1 || concurrency > 10 {
			return fmt.Errorf("REMINDER_CONCURRENCY deve estar entre 1 e 10")
		}
	}
	interval := 5 * time.Minute
	if value := os.Getenv("REMINDER_INTERVAL"); value != "" {
		interval, err = time.ParseDuration(value)
		if err != nil || interval < time.Second {
			return fmt.Errorf("REMINDER_INTERVAL deve ser uma duração >=1s")
		}
	}
	mode := os.Getenv("REMINDER_MODE")
	if mode == "" {
		mode = "two_hours"
	}
	if mode != "two_hours" && mode != "next_day" {
		return fmt.Errorf("REMINDER_MODE deve ser two_hours ou next_day")
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	connectCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	pool, err := database.Connect(connectCtx, os.Getenv("DATABASE_URL"))
	cancel()
	if err != nil {
		return err
	}
	defer pool.Close()
	client := &http.Client{Timeout: 15 * time.Second, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}
	defer client.CloseIdleConnections()
	worker := &services.Reminders{
		Repository:  &repository.Repository{Pool: pool, Location: loc},
		Sender:      &notifications.HTTPGateway{URL: gatewayURL, Token: token, Instance: os.Getenv("EVOLUTION_INSTANCE"), Client: client, Location: loc},
		Concurrency: concurrency, Interval: interval, Mode: mode,
	}
	if *once {
		return worker.RunOnce(ctx, time.Now())
	}
	log.Printf("worker iniciado: modo=%s intervalo=%s concorrência=%d", mode, interval, concurrency)
	worker.Run(ctx)
	return nil
}
