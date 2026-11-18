"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Maximize, Megaphone, Volume2, VolumeX } from "lucide-react";
import { callAnnouncement, inService, publicName, recentCalls, roomNumber, ticketCode, waitingQueue } from "@/services/call-panel";
import { minutesToClock } from "@/services/queue-wait";
import type { Appointment } from "@/types/dashboard";
import { slides, tickerText } from "./panel-content";
import { ClinicLogo } from "@/components/clinic-logo";
import { PanelIllustration } from "./panel-illustrations";
import { createAudioContext, playChime, speak, stopSpeaking } from "./panel-audio";
import { usePanelFeed } from "./panel-sync";

const MAX_CALLS = 8;
const control = "inline-flex min-h-10 items-center gap-2 rounded-xl border border-line-strong bg-white px-3 text-sm font-semibold text-ink-soft hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-40";
const ribbon = "absolute -left-16 top-9 w-56 -rotate-45 py-1.5 text-center text-xs font-extrabold uppercase tracking-[0.2em] text-white shadow-md";

/** Avisos e dicas de saúde que giram no lado esquerdo, com ilustração e fita colorida no canto (textos em panel-content.ts) */
function InfoCarousel() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex(current => (current + 1) % slides.length), 9000);
    return () => clearInterval(id);
  }, []);
  const slide = slides[index];
  return (
    <>
      <span className={`${ribbon} ${slide.ribbonColor}`}>{slide.ribbon}</span>
      <div role="group" aria-roledescription="carrossel" aria-label="Informações para quem aguarda" className="flex h-full flex-col gap-4 pt-6">
        <div key={slide.id} className="panel-slide flex min-h-0 flex-1 flex-col gap-4">
          <h2 className="pl-14 text-3xl font-extrabold leading-tight text-ink md:text-5xl">{slide.title}</h2>
          <PanelIllustration scene={slide.id} className="min-h-0 w-full flex-1" />
          <p className="text-xl leading-relaxed text-ink-soft md:text-2xl">{slide.text}</p>
        </div>
        <div className="flex items-end justify-between gap-4">
        <div className="flex gap-2 pb-1" role="tablist" aria-label="Escolher aviso">
          {slides.map((item, position) => (
            <button key={item.id} type="button" role="tab" aria-selected={position === index} aria-label={`Aviso ${position + 1}: ${item.title}`} onClick={() => setIndex(position)} className={`h-2.5 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-brand-600 ${position === index ? "w-10 bg-brand-600" : "w-2.5 bg-line-strong hover:bg-muted"}`} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <ClinicLogo size={56} />
          <div>
            <p className="text-lg font-extrabold leading-tight text-ink">Clínica Bem Viver</p>
            <p className="text-sm text-muted">Sala de espera</p>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

/** Tela para a TV da sala de espera, em tema claro: avisos e dicas de um lado, últimas chamadas (senha e consultório) do outro. */
export function CallPanel() {
  const [voiceOn, setVoiceOn] = useState(false);
  const [calls, setCalls] = useState<Appointment[]>([]);
  const [highlight, setHighlight] = useState<Appointment | null>(null);
  const voiceRef = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Mostra a chamada em destaque por 10 s e, com a voz ligada, toca o sinal e fala. record=false é só o teste. */
  function announce(appointment: Appointment, all: Appointment[], record = true) {
    if (record) setCalls(previous => [appointment, ...previous.filter(item => item.id !== appointment.id)].slice(0, MAX_CALLS));
    setHighlight(appointment);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlight(null), 10000);
    if (voiceRef.current) { playChime(audio.current); speak(callAnnouncement(appointment, roomNumber(appointment.professional, all))); }
  }

  const feed = usePanelFeed((newCalls, all) => newCalls.forEach(appointment => announce(appointment, all)));

  useEffect(() => () => {
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    stopSpeaking();
    audio.current?.close();
  }, []);

  function toggleVoice() {
    const next = !voiceOn;
    voiceRef.current = next;
    setVoiceOn(next);
    if (!next) { stopSpeaking(); return; }
    audio.current ??= createAudioContext();
    playChime(audio.current);
    speak("Voz e som ativados.");
  }

  const queue = waitingQueue(feed.appointments, feed.date);
  const grid = recentCalls(calls, inService(feed.appointments, feed.date), MAX_CALLS);
  const roomOf = (appointment: Appointment) => roomNumber(appointment.professional, feed.appointments);
  const dateLabel = new Date(`${feed.date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <main className="fixed inset-0 z-[100] flex flex-col gap-5 overflow-y-auto bg-white p-5 text-ink md:p-8">
      <header className="flex justify-end">
        <h1 className="sr-only">Painel de chamada · Clínica Bem Viver · Sala de espera</h1>
        <div className="text-right">
          <p className="text-5xl font-extrabold tabular-nums md:text-6xl">{minutesToClock(feed.clockMinutes)}</p>
          <p className="text-sm capitalize text-muted">{dateLabel}</p>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[1.1fr_1fr]">
        {/* Esquerda: avisos e dicas, ou a chamada nova em destaque */}
        <section aria-label={highlight ? "Chamada em destaque" : "Avisos e dicas de saúde"} className={`relative overflow-hidden rounded-3xl border-2 p-8 md:p-10 ${highlight ? "border-brand-500 bg-brand-50 shadow-[0_0_0_6px_rgb(211_255_91)]" : "border-brand-200 bg-gradient-to-br from-brand-100 via-white to-brand-50"}`}>
          {highlight ? (
            <>
              <span className={`${ribbon} bg-brand-700`}>Chamando</span>
              <div className="flex h-full flex-col justify-center pl-4">
                <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.25em] text-brand-700"><Megaphone size={18} aria-hidden="true" /><span className="motion-safe:animate-pulse">Chamando agora</span></h2>
                <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-muted">Senha</p>
                <p className="text-7xl font-extrabold leading-none tracking-tight text-brand-700 md:text-9xl">{ticketCode(highlight)}</p>
                <p className="mt-6 text-4xl font-bold md:text-6xl">{publicName(highlight.patient.name)}</p>
                <p className="mt-6 text-3xl font-semibold text-brand-800 md:text-4xl">Consultório {roomOf(highlight)}</p>
                <p className="mt-1 text-xl text-muted">{highlight.professional} · {highlight.specialty}</p>
              </div>
            </>
          ) : (
            <InfoCarousel />
          )}
        </section>

        {/* Direita: últimas chamadas, no estilo dos painéis de senha */}
        <section aria-labelledby="painel-chamadas" className="flex min-h-0 flex-col rounded-3xl border border-line bg-soft p-5 md:p-6">
          <h2 id="painel-chamadas" className="text-sm font-bold uppercase tracking-[0.25em] text-brand-700">Últimas chamadas</h2>
          <ol className="mt-4 grid flex-1 grid-cols-2 gap-3 [grid-template-rows:repeat(4,minmax(0,1fr))]">
            {grid.map((appointment, position) => {
              const isNow = highlight?.id === appointment.id;
              const label = isNow ? "text-ink" : "text-white";
              return (
                <li key={appointment.id} className={`flex flex-col justify-between rounded-2xl p-4 ${isNow ? "panel-call bg-accent text-brand-800" : position === 0 ? "bg-brand-700 text-white" : "bg-brand-600 text-white"}`}>
                  <p className="truncate text-sm font-semibold">{publicName(appointment.patient.name)}</p>
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider ${label}`}>Senha</p>
                      <p className="text-3xl font-extrabold leading-none md:text-4xl">{ticketCode(appointment)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-semibold uppercase tracking-wider ${label}`}>Consultório</p>
                      <p className="text-3xl font-extrabold leading-none md:text-4xl">{roomOf(appointment)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
            {Array.from({ length: MAX_CALLS - grid.length }, (_, slot) => <li key={`vazio-${slot}`} aria-hidden="true" className="rounded-2xl border-2 border-dashed border-line-strong" />)}
          </ol>
          <p className="mt-4 text-sm text-muted">
            {queue.length ? `Aguardando: ${queue.length} · próximas senhas ${queue.slice(0, 4).map(ticketCode).join(" · ")}` : "Ninguém aguardando no momento."}
          </p>
        </section>
      </div>

      {/* Faixa de texto correndo, como nos painéis de hospital */}
      <div className="overflow-hidden rounded-xl border border-line bg-white py-3 text-xl font-extrabold text-brand-700 md:text-2xl" aria-hidden="true">
        <div className="panel-ticker flex w-max whitespace-nowrap motion-reduce:w-auto motion-reduce:whitespace-normal">
          <span className="px-8">{tickerText}</span>
          <span className="px-8 motion-reduce:hidden">{tickerText}</span>
        </div>
      </div>
      <p className="sr-only">{tickerText}</p>

      <footer className="flex flex-wrap items-center justify-end gap-3">
        <button type="button" onClick={toggleVoice} aria-pressed={voiceOn} className={control}>
          {voiceOn ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
          {voiceOn ? "Voz e som ativados" : "Ativar voz e som"}
        </button>
        <button type="button" onClick={() => queue[0] && announce(queue[0], feed.appointments, false)} disabled={!voiceOn || queue.length === 0} className={control}>Testar chamada</button>
        <button type="button" onClick={() => document.documentElement.requestFullscreen?.()} className={control}><Maximize size={16} aria-hidden="true" />Tela cheia</button>
        <Link href="/dashboard/agenda" className={control}>Voltar ao sistema</Link>
      </footer>

      <p role="status" aria-live="polite" className="sr-only">{highlight ? callAnnouncement(highlight, roomOf(highlight)) : ""}</p>
      <p className="sr-only">{feed.synced ? "Acompanhando a recepção em tempo real." : "Mostrando os dados desta janela."}</p>
    </main>
  );
}
