export type AppointmentStatus = "agendado" | "confirmado" | "chegou" | "em_atendimento" | "concluido";
export interface Patient { id: number; name: string; phone: string; email: string; initials: string; }
export type AttendanceType = "particular" | "unimed" | "bradesco";
export interface Appointment { id: number; patient: Patient; professional: string; specialty: string; time: string; date: string; status: AppointmentStatus; attendanceType: AttendanceType; amountCents: number; checkInAt?: string; durationMinutes?: number; condition?: string; modality?: "presencial" | "video"; }
export const attendanceLabels: Record<AttendanceType, string> = { particular: "Particular", unimed: "Unimed", bradesco: "Bradesco Saúde" };
export const attendanceStyles: Record<AttendanceType, string> = { particular: "bg-emerald-50 text-emerald-700", unimed: "bg-cyan-50 text-cyan-700", bradesco: "bg-orange-50 text-orange-700" };
export interface DashboardMetric { label: string; value: number; description: string; icon: "patients" | "appointments" | "queue" | "completed"; featured?: boolean; }
export const statusLabels: Record<AppointmentStatus, string> = { agendado: "Agendado", confirmado: "Confirmado", chegou: "Na recepção", em_atendimento: "Em atendimento", concluido: "Concluído" };
export const statusStyles: Record<AppointmentStatus, string> = { agendado: "bg-slate-100 text-slate-600", confirmado: "bg-blue-50 text-blue-700", chegou: "bg-amber-50 text-amber-800", em_atendimento: "bg-violet-50 text-violet-700", concluido: "bg-emerald-50 text-emerald-700" };
