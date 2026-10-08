package models

import "time"

type Reminder struct {
	ID         int64
	ClinicID   int64
	StartTime  time.Time
	ClientName string
	Phone      string
	ClinicName string
	Attempts   int
	ClaimToken string
}
