package services

import (
	"agendamento-clinica/backend/internal/models"
	"time"
	_ "time/tzdata"
)

func ValidAvailability(slots []models.Availability) bool {
	for i, s := range slots {
		start, e1 := time.Parse("15:04", s.Start)
		end, e2 := time.Parse("15:04", s.End)
		if s.Weekday < 0 || s.Weekday > 6 || e1 != nil || e2 != nil || start.Format("15:04") != s.Start || end.Format("15:04") != s.End || !end.After(start) {
			return false
		}
		for _, other := range slots[:i] {
			if other.Weekday == s.Weekday && s.Start < other.End && s.End > other.Start {
				return false
			}
		}
	}
	return true
}

func WithinHours(start, end time.Time, slots []models.Availability, loc *time.Location) bool {
	if !end.After(start) || !ValidAvailability(slots) {
		return false
	}
	start, end = start.In(loc), end.In(loc)
	if start.Format("2006-01-02") != end.Format("2006-01-02") {
		return false
	}
	for _, s := range slots {
		if s.Weekday != int(start.Weekday()) {
			continue
		}
		from, err := time.Parse("15:04", s.Start)
		if err != nil {
			return false
		}
		to, err := time.Parse("15:04", s.End)
		if err != nil {
			return false
		}
		from = time.Date(start.Year(), start.Month(), start.Day(), from.Hour(), from.Minute(), 0, 0, loc)
		to = time.Date(start.Year(), start.Month(), start.Day(), to.Hour(), to.Minute(), 0, 0, loc)
		if !start.Before(from) && !end.After(to) {
			return true
		}
	}
	return false
}
