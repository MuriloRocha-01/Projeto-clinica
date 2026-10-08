package main

import (
	"agendamento-clinica/backend/internal/database"
	"agendamento-clinica/backend/internal/handlers"
	"agendamento-clinica/backend/internal/repository"
	"agendamento-clinica/backend/internal/services"
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	timezone := os.Getenv("APPOINTMENT_TIMEZONE")
	if timezone == "" {
		timezone = "America/Sao_Paulo"
	}
	location, err := time.LoadLocation(timezone)
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	pool, err := database.Connect(ctx, os.Getenv("DATABASE_URL"))
	cancel()
	if err != nil {
		return err
	}
	defer pool.Close()
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	repo := &repository.Repository{Pool: pool, Location: location}
	h := &handlers.Handler{Repo: repo, Appointments: &services.Appointments{Repository: repo}, WhatsAppWebhookSecret: os.Getenv("WHATSAPP_WEBHOOK_SECRET"), EvolutionInstance: os.Getenv("EVOLUTION_INSTANCE")}
	server := &http.Server{Addr: ":" + port, Handler: h.Routes(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 15 * time.Second, IdleTimeout: 60 * time.Second}
	stopCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	done := make(chan struct{})
	go func() {
		defer close(done)
		<-stopCtx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			log.Printf("encerrar servidor: %v", err)
			if closeErr := server.Close(); closeErr != nil {
				log.Printf("fechar servidor: %v", closeErr)
			}
		}
	}()
	log.Printf("API em http://localhost:%s", port)
	err = server.ListenAndServe()
	stop()
	<-done
	if errors.Is(err, http.ErrServerClosed) {
		return nil
	}
	return err
}
