package models

import "time"

type Clinic struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	CNPJ      string    `json:"cnpj"`
	Address   string    `json:"address"`
	CreatedAt time.Time `json:"created_at"`
}

type Availability struct {
	Weekday int    `json:"weekday"`
	Start   string `json:"start"`
	End     string `json:"end"`
}

type Professional struct {
	ID           int64          `json:"id"`
	ClinicID     int64          `json:"clinic_id"`
	Name         string         `json:"name"`
	Specialty    string         `json:"specialty"`
	Availability []Availability `json:"availability"`
	CreatedAt    time.Time      `json:"created_at"`
}

type Client struct {
	ID        int64     `json:"id"`
	ClinicID  int64     `json:"clinic_id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	BirthDate string    `json:"birth_date"`
	CreatedAt time.Time `json:"created_at"`
}

type Appointment struct {
	ID             int64      `json:"id"`
	ClinicID       int64      `json:"clinic_id"`
	ProfessionalID int64      `json:"professional_id"`
	ClientID       int64      `json:"client_id"`
	StartTime      time.Time  `json:"start_time"`
	EndTime        time.Time  `json:"end_time"`
	Status         string     `json:"status"`
	Priority       int        `json:"priority"`
	Notes          *string    `json:"notes"`
	CreatedAt      time.Time  `json:"created_at"`
	CheckInAt      *time.Time `json:"check_in_at"`
	CalledAt       *time.Time `json:"called_at"`
	CompletedAt    *time.Time `json:"completed_at"`
}

type QueuePatient struct {
	Appointment
	ClientName  string `json:"client_name"`
	ClientPhone string `json:"client_phone"`
}

type DailyQueue struct {
	Arrived  []QueuePatient `json:"arrived"`
	Upcoming []QueuePatient `json:"upcoming"`
}
