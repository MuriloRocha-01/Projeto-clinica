// Relógio e tempo de espera da fila. Sem imports com alias ("@/"), para os testes rodarem direto no Node.

/** Início do relógio da demonstração: 10:03, logo depois do último check-in de exemplo (09:55). */
export const DEMO_START_MINUTES = 10 * 60 + 3;
/** A partir de quantos minutos a espera pede atenção e vira espera longa */
export const WAIT_WARN_MINUTES = 15;
export const WAIT_LATE_MINUTES = 30;

export type WaitTone = "ok" | "warn" | "late";

/** "09:42" -> 582. Devolve null para texto inválido. */
export function clockToMinutes(clock: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(clock.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** 582 -> "09:42". Dá a volta à meia-noite. */
export function minutesToClock(total: number): string {
  const day = ((Math.floor(total) % 1440) + 1440) % 1440;
  return `${String(Math.floor(day / 60)).padStart(2, "0")}:${String(day % 60).padStart(2, "0")}`;
}

/** Minutos inteiros desde o check-in. Nunca negativo; null se a hora de chegada for inválida. */
export function waitMinutes(checkInAt: string, nowMinutes: number): number | null {
  const start = clockToMinutes(checkInAt);
  if (start === null) return null;
  return Math.max(0, Math.floor(nowMinutes - start));
}

export function waitTone(minutes: number): WaitTone {
  if (minutes >= WAIT_LATE_MINUTES) return "late";
  if (minutes >= WAIT_WARN_MINUTES) return "warn";
  return "ok";
}

export function waitLabel(minutes: number): string {
  if (minutes < 1) return "Acabou de chegar";
  if (minutes < 60) return `Aguardando há ${minutes} min`;
  const rest = minutes % 60;
  return `Aguardando há ${Math.floor(minutes / 60)} h${rest ? ` ${String(rest).padStart(2, "0")} min` : ""}`;
}
