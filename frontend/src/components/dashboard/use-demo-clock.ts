"use client";

import { useEffect, useState } from "react";
import { DEMO_START_MINUTES, minutesToClock } from "@/services/queue-wait";

// A demonstração tem data fixa (08/10/2026), então ela também tem um relógio próprio: começa às 10:03 e anda em tempo real.
// Fica no módulo para continuar de onde estava quando a pessoa troca de tela; recarregar a página reinicia.
let startedAt: number | null = null;

/** Hora atual da demonstração, em minutos desde a meia-noite */
export function demoClockMinutes(): number {
  if (startedAt === null) return DEMO_START_MINUTES; // ainda não montou (servidor ou 1º render): valor igual nos dois lados
  return DEMO_START_MINUTES + (Date.now() - startedAt) / 60000;
}

/** "HH:MM" da demonstração: é o que fica gravado como hora de chegada nos check-ins */
export function demoClockTime(): string {
  return minutesToClock(demoClockMinutes());
}

/** Devolve a hora da demonstração e a atualiza de tempos em tempos */
export function useDemoClock(intervalMs = 15000): number {
  const [minutes, setMinutes] = useState(demoClockMinutes);
  useEffect(() => {
    if (startedAt === null) startedAt = Date.now();
    const id = setInterval(() => setMinutes(demoClockMinutes()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return minutes;
}
