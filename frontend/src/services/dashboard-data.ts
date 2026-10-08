import type { Appointment } from "@/types/dashboard";

// Dados fictícios; a demonstração não altera o banco.
export const demoAppointments: Appointment[] = [
  { id: 1, attendanceType: "particular", amountCents: 25000, patient: { id: 1, name: "Mariana Costa", initials: "MC", phone: "(11) 99999-0101", email: "mariana@example.com" }, professional: "Dra. Ana Oliveira", specialty: "Clínica geral", condition: "Consulta de rotina", modality: "presencial", time: "09:00", date: "2026-10-08", status: "concluido", checkInAt: "08:48" },
  { id: 2, attendanceType: "unimed", amountCents: 14000, patient: { id: 2, name: "Ricardo Almeida", initials: "RA", phone: "(11) 99999-0102", email: "ricardo@example.com" }, professional: "Dr. Lucas Mendes", specialty: "Cardiologia", condition: "Avaliação cardiológica", modality: "presencial", time: "09:30", date: "2026-10-08", status: "em_atendimento", checkInAt: "09:15" },
  { id: 3, attendanceType: "bradesco", amountCents: 16000, patient: { id: 3, name: "Juliana Santos", initials: "JS", phone: "(11) 99999-0103", email: "juliana@example.com" }, professional: "Dra. Ana Oliveira", specialty: "Clínica geral", condition: "Consulta de rotina", modality: "presencial", time: "10:00", date: "2026-10-08", status: "chegou", checkInAt: "09:42" },
  { id: 4, attendanceType: "particular", amountCents: 30000, patient: { id: 4, name: "Pedro Henrique", initials: "PH", phone: "(11) 99999-0104", email: "pedro@example.com" }, professional: "Dr. Lucas Mendes", specialty: "Cardiologia", condition: "Avaliação cardiológica", modality: "presencial", time: "10:30", date: "2026-10-08", status: "chegou", checkInAt: "09:55" },
  { id: 5, attendanceType: "unimed", amountCents: 14000, patient: { id: 5, name: "Beatriz Lima", initials: "BL", phone: "(11) 99999-0105", email: "beatriz@example.com" }, professional: "Dra. Ana Oliveira", specialty: "Clínica geral", condition: "Consulta de rotina", modality: "presencial", time: "11:00", date: "2026-10-08", status: "confirmado" },
  { id: 6, attendanceType: "particular", amountCents: 30000, patient: { id: 6, name: "Carlos Eduardo", initials: "CE", phone: "(11) 99999-0106", email: "carlos@example.com" }, professional: "Dr. Lucas Mendes", specialty: "Cardiologia", condition: "Avaliação cardiológica", modality: "presencial", time: "11:30", date: "2026-10-08", status: "agendado" },
  { id: 7, attendanceType: "bradesco", amountCents: 16000, patient: { id: 7, name: "Fernanda Rocha", initials: "FR", phone: "(11) 99999-0107", email: "fernanda@example.com" }, professional: "Dra. Ana Oliveira", specialty: "Clínica geral", condition: "Consulta de rotina", modality: "presencial", time: "14:00", date: "2026-10-08", status: "confirmado" },
  { id: 8, attendanceType: "particular", amountCents: 25000, patient: { id: 8, name: "Gabriel Martins", initials: "GM", phone: "(11) 99999-0108", email: "gabriel@example.com" }, professional: "Dr. Lucas Mendes", specialty: "Cardiologia", condition: "Avaliação cardiológica", modality: "presencial", time: "14:30", date: "2026-10-08", status: "agendado" },
];


// Consultas fictícias adicionais para visualizar a semana completa.
demoAppointments.push(
  { ...demoAppointments[0], id:9, date:"2026-10-05",time:"10:00",durationMinutes:60,status:"concluido" },
  { ...demoAppointments[4], id:10,date:"2026-10-07",time:"11:00",durationMinutes:60,status:"confirmado",modality:"video" },
  { ...demoAppointments[2], id:11,date:"2026-10-09",time:"13:00",durationMinutes:60,status:"agendado",checkInAt:undefined },
  { ...demoAppointments[7], id:12,date:"2026-10-10",time:"10:00",durationMinutes:60,status:"confirmado" },
);
