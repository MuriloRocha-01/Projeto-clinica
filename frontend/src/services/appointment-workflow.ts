import type { Appointment, AppointmentStatus } from "../types/dashboard.ts";

export const nextAppointmentStatus: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
  agendado: "chegou", confirmado: "chegou", chegou: "em_atendimento", em_atendimento: "concluido",
};

export function appointmentTransitionError(
  appointments: Appointment[], current: Appointment, target: AppointmentStatus,
): string | null {
  if (current.status === "concluido" || current.status === "cancelado") return "Este agendamento já foi encerrado.";
  if (target !== "cancelado" && nextAppointmentStatus[current.status] !== target) return "A etapa deste atendimento mudou. Confira o status atual.";
  if (target === "em_atendimento" && appointments.some(item => item.id !== current.id && item.date === current.date && item.professional === current.professional && item.status === "em_atendimento")) {
    return "Este profissional já está em atendimento. Finalize a consulta atual antes de chamar outro paciente.";
  }
  return null;
}
