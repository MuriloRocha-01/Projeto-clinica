import type { SystemSettings } from "@/types/settings";

export const demoSettings: SystemSettings = {
  professionals: [
    { id: "ana", name: "Dra. Ana Oliveira", specialty: "Clínica geral", crm: "123456 / SP", photo: "", weekdays: [1, 2, 3, 4, 5], start: "08:00", end: "18:00", active: true },
    { id: "lucas", name: "Dr. Lucas Mendes", specialty: "Cardiologia", crm: "234567 / SP", photo: "", weekdays: [1, 3, 5], start: "09:00", end: "17:00", active: true },
  ],
  users: [
    { id: "manager", name: "Ana Oliveira", email: "ana@example.com", role: "admin", active: true },
    { id: "reception", name: "Camila Souza", email: "camila@example.com", role: "reception", active: true },
    { id: "doctor", name: "Lucas Mendes", email: "lucas@example.com", role: "doctor", active: true },
  ],
  consultationTypes: [
    { id: "particular", name: "Particular", active: true },
    { id: "unimed", name: "Convênio Unimed", active: true },
    { id: "bradesco", name: "Convênio Bradesco", active: true },
    { id: "retorno", name: "Retorno", active: true },
  ],
  defaultDuration: 30, openingTime: "08:00", closingTime: "18:00", cancellationHours: 24,
};
