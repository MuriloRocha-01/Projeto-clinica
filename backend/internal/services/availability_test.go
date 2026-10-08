package services

import (
	"agendamento-clinica/backend/internal/models"
	"testing"
	"time"
)

func TestWorkingHours(t *testing.T) {
	loc, err := time.LoadLocation("America/Sao_Paulo")
	if err != nil {
		t.Fatal(err)
	}
	slots := []models.Availability{{Weekday: 4, Start: "09:00", End: "12:00"}, {Weekday: 4, Start: "14:00", End: "18:00"}}
	for _, tc := range []struct {
		start, end string
		ok         bool
	}{
		{"2026-10-08T09:00:00-03:00", "2026-10-08T12:00:00-03:00", true},
		{"2026-10-08T12:00:00Z", "2026-10-08T15:00:00Z", true},
		{"2026-10-08T08:59:59-03:00", "2026-10-08T10:00:00-03:00", false},
		{"2026-10-08T11:00:00-03:00", "2026-10-08T12:00:00.000001-03:00", false},
		{"2026-10-08T11:00:00-03:00", "2026-10-08T15:00:00-03:00", false},
		{"2026-10-09T09:00:00-03:00", "2026-10-09T10:00:00-03:00", false},
		{"2026-10-08T17:00:00-03:00", "2026-10-09T09:00:00-03:00", false},
		{"2026-10-08T09:00:00-03:00", "2026-10-08T09:00:00-03:00", false},
	} {
		start, _ := time.Parse(time.RFC3339Nano, tc.start)
		end, _ := time.Parse(time.RFC3339Nano, tc.end)
		if got := WithinHours(start, end, slots, loc); got != tc.ok {
			t.Errorf("%s/%s: got %v", tc.start, tc.end, got)
		}
	}
	if WithinHours(time.Now(), time.Now().Add(time.Hour), nil, loc) {
		t.Fatal("empty availability accepted")
	}
}

func TestAvailability(t *testing.T) {
	for _, slots := range [][]models.Availability{
		{{Weekday: 7, Start: "09:00", End: "18:00"}},
		{{Weekday: 1, Start: "18:00", End: "09:00"}},
		{{Weekday: 1, Start: "9:00", End: "18:00"}},
		{{Weekday: 1, Start: "09:00", End: "12:00"}, {Weekday: 1, Start: "11:00", End: "13:00"}},
	} {
		if ValidAvailability(slots) {
			t.Errorf("invalid availability accepted: %v", slots)
		}
	}
}
