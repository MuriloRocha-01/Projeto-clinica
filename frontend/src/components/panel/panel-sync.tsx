"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useClinic } from "@/components/clinic-provider";
import { demoClockMinutes, useDemoClock } from "@/components/dashboard/use-demo-clock";
import { detectNewCalls } from "@/services/call-panel";
import type { Appointment } from "@/types/dashboard";

// Os dados da demonstração ficam na memória de cada janela. Para o painel (aberto na TV, em outra janela) acompanhar
// o que a recepção faz, a janela principal envia a fila por BroadcastChannel, recurso do próprio navegador.
const CHANNEL = "cliniq-painel";

type Snapshot = { type: "snapshot"; appointments: Appointment[]; date: string; clockMinutes: number };
type Message = Snapshot | { type: "request" };

/** Fica na janela principal: envia a fila ao painel quando ela muda e quando o painel pede ao abrir. */
export function PanelBroadcaster() {
  const { appointments, date } = useClinic();
  const pathname = usePathname();
  const isPanel = pathname === "/painel";
  const channel = useRef<BroadcastChannel | null>(null);
  const latest = useRef({ appointments, date });

  useEffect(() => {
    if (isPanel || typeof BroadcastChannel === "undefined") return;
    const current = new BroadcastChannel(CHANNEL);
    channel.current = current;
    const send = () => current.postMessage({ type: "snapshot", ...latest.current, clockMinutes: demoClockMinutes() } satisfies Snapshot);
    current.onmessage = (event: MessageEvent<Message>) => { if (event.data.type === "request") send(); };
    return () => { current.close(); channel.current = null; };
  }, [isPanel]);

  useEffect(() => {
    latest.current = { appointments, date };
    channel.current?.postMessage({ type: "snapshot", appointments, date, clockMinutes: demoClockMinutes() } satisfies Snapshot);
  }, [appointments, date]);

  return null;
}

export interface PanelFeed { appointments: Appointment[]; date: string; clockMinutes: number; synced: boolean }

/**
 * Dados do painel. Enquanto nenhuma janela principal responde, usa os da própria janela.
 * Chama onNewCalls quando alguém passa a estar em atendimento (a primeira carga não conta como chamada).
 */
export function usePanelFeed(onNewCalls: (calls: Appointment[], all: Appointment[]) => void): PanelFeed {
  const local = useClinic();
  const localClock = useDemoClock();
  const [remote, setRemote] = useState<{ appointments: Appointment[]; date: string; base: number; receivedAt: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const previous = useRef<Appointment[] | null>(null);
  const callback = useRef(onNewCalls);

  useEffect(() => { callback.current = onNewCalls; });

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event: MessageEvent<Message>) => {
      if (event.data.type !== "snapshot") return;
      const { appointments, date, clockMinutes } = event.data;
      const calls = previous.current ? detectNewCalls(previous.current, appointments) : [];
      previous.current = appointments;
      const at = Date.now();
      setRemote({ appointments, date, base: clockMinutes, receivedAt: at });
      setNow(at);
      if (calls.length) callback.current(calls, appointments);
    };
    channel.postMessage({ type: "request" } satisfies Message);
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => { clearInterval(id); channel.close(); };
  }, []);

  if (!remote) return { appointments: local.appointments, date: local.date, clockMinutes: localClock, synced: false };
  return { appointments: remote.appointments, date: remote.date, clockMinutes: remote.base + (now - remote.receivedAt) / 60000, synced: true };
}
