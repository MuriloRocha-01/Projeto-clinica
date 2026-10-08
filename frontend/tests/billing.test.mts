import assert from "node:assert/strict";
import { billingSummary, parseMoney, formatMoney } from "../src/services/billing.ts";
import type { Appointment } from "../src/types/dashboard.ts";

assert.equal(parseMoney("250,10"), 25010);
assert.equal(parseMoney("0.09"), 9);
for (const value of ["-1", "NaN", "10,999", "", "1000001"]) assert.equal(parseMoney(value), null);
const appointments = [
  { attendanceType: "particular", amountCents: 25010, status: "concluido" },
  { attendanceType: "particular", amountCents: 30000, status: "agendado" },
  { attendanceType: "unimed", amountCents: 14000, status: "concluido" },
  { attendanceType: "bradesco", amountCents: 16000, status: "confirmado" },
] as Appointment[];
assert.deepEqual(billingSummary(appointments), { privateExpected: 55010, privateCompleted: 25010, insuranceExpected: 30000, insuranceCompleted: 14000 });
assert.deepEqual(billingSummary([]), { privateExpected: 0, privateCompleted: 0, insuranceExpected: 0, insuranceCompleted: 0 });
console.log("Valores em centavos e separação de convênios: OK");

assert.equal(formatMoney(Number.NaN), "Não informado");
