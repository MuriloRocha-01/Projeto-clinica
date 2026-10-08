package services

import "testing"

func TestAppointmentTransitions(t *testing.T) {
	allowed := map[string]map[string]bool{
		"agendado":       {"confirmado": true, "chegou": true, "faltou": true, "cancelado": true},
		"confirmado":     {"chegou": true, "faltou": true, "cancelado": true},
		"chegou":         {"em_atendimento": true, "cancelado": true},
		"em_atendimento": {"concluido": true},
		"cancelado":      {"agendado": true},
	}
	states := []string{"agendado", "confirmado", "chegou", "em_atendimento", "concluido", "faltou", "cancelado", "pendente", "invalid"}
	for _, from := range states {
		for _, to := range states {
			want := ValidAppointmentStatus(from) && ValidAppointmentStatus(to) && (from == to || allowed[from][to])
			if CanTransition(from, to) != want {
				t.Errorf("%s -> %s", from, to)
			}
		}
	}
}
