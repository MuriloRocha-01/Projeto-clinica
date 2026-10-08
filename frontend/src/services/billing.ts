import type { Appointment } from "@/types/dashboard";

export function formatMoney(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) return "Não informado";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function parseMoney(value: string): number | null {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value)) return null;
  const [reais, fraction = ""] = value.replace(",", ".").split(".");
  const cents = Number(reais) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents <= 100_000_000 ? cents : null;
}

export function billingSummary(appointments: Appointment[]) {
  return appointments.reduce((total, appointment) => {
    if (!Number.isSafeInteger(appointment.amountCents) || appointment.amountCents < 0) return total;
    if (appointment.attendanceType === "particular") {
      total.privateExpected += appointment.amountCents;
      if (appointment.status === "concluido") total.privateCompleted += appointment.amountCents;
    } else {
      total.insuranceExpected += appointment.amountCents;
      if (appointment.status === "concluido") total.insuranceCompleted += appointment.amountCents;
    }
    return total;
  }, { privateExpected: 0, privateCompleted: 0, insuranceExpected: 0, insuranceCompleted: 0 });
}
