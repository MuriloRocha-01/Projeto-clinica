package services

// Compatibility with the previously deployed reception status.
func CanonicalAppointmentStatus(status string) string {
	if status == "na_recepcao" {
		return "chegou"
	}
	return status
}

func ValidAppointmentStatus(status string) bool {
	switch status {
	case "agendado", "confirmado", "chegou", "em_atendimento", "concluido", "faltou", "cancelado":
		return true
	default:
		return false
	}
}

func CanTransition(from, to string) bool {
	if !ValidAppointmentStatus(from) || !ValidAppointmentStatus(to) {
		return false
	}
	if from == to {
		return true
	}
	switch from {
	case "agendado":
		return to == "confirmado" || to == "chegou" || to == "faltou" || to == "cancelado"
	case "confirmado":
		return to == "chegou" || to == "faltou" || to == "cancelado"
	case "chegou":
		return to == "em_atendimento" || to == "cancelado"
	case "em_atendimento":
		return to == "concluido"
	case "cancelado":
		return to == "agendado"
	default:
		return false
	}
}
