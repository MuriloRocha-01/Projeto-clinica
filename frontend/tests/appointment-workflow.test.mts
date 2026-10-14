import assert from "node:assert/strict";
import { appointmentTransitionError, nextAppointmentStatus } from "../src/services/appointment-workflow.ts";
import { appointmentsOverlap } from "../src/services/calendar.ts";
import type { Appointment } from "../src/types/dashboard.ts";

const scheduled: Appointment = {
  id: 1, patient: { id: 1, name: "Paciente teste", email: "", phone: "", initials: "PT" },
  professional: "Dra. Teste", specialty: "Clínica geral", date: "2026-10-14", time: "09:00",
  status: "agendado", attendanceType: "particular", amountCents: 10000,
};
let current = scheduled;
for (const target of ["chegou", "em_atendimento", "concluido"] as const) {
  assert.equal(nextAppointmentStatus[current.status], target);
  assert.equal(appointmentTransitionError([current], current, target), null);
  current = { ...current, status: target };
}
assert.ok(appointmentTransitionError([current], current, "cancelado"));
assert.ok(appointmentTransitionError([scheduled], scheduled, "concluido"));
for (const status of ["agendado", "confirmado", "chegou", "em_atendimento"] as const) {
  const item = { ...scheduled, status };
  assert.equal(appointmentTransitionError([item], item, "cancelado"), null);
}
const cancelled = { ...scheduled, status: "cancelado" as const };
assert.ok(appointmentTransitionError([cancelled], cancelled, "chegou"));
const arrived = { ...scheduled, status: "chegou" as const };
const busy = { ...scheduled, id: 2, status: "em_atendimento" as const };
assert.ok(appointmentTransitionError([arrived, busy], arrived, "em_atendimento"));
assert.equal(appointmentTransitionError([arrived, { ...busy, professional: "Outro profissional" }], arrived, "em_atendimento"), null);
assert.equal(appointmentsOverlap(scheduled, { ...scheduled, id: 3 }), true);
assert.equal(appointmentsOverlap(cancelled, { ...scheduled, id: 3 }), false);
console.log("Fluxo: etapas, cancelamento, profissional ocupado e liberação de horário OK");
