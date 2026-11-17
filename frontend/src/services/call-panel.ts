import type { Appointment } from "@/types/dashboard";

// Regras do painel de chamada da sala de espera. Funções puras, testadas em tests/call-panel.test.mts.

/**
 * Nome para a tela pública: primeiro nome e inicial do último sobrenome ("Juliana Santos" -> "Juliana S.").
 * A sala de espera é um lugar aberto, então o nome completo (dado pessoal, LGPD) não aparece.
 */
export function publicName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Paciente";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toLocaleUpperCase("pt-BR")}.`;
}

const withoutAccents = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Senha da consulta: letras da especialidade + número da consulta ("Clínica geral", #3 -> "CG03"; "Cardiologia", #7 -> "CA07") */
export function ticketCode(appointment: Appointment): string {
  const words = withoutAccents(appointment.specialty ?? "").split(/\s+/).filter(word => word.length > 2);
  const letters = words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? "AT").slice(0, 2);
  return `${letters.toLocaleUpperCase("pt-BR")}${String(appointment.id).padStart(2, "0")}`;
}

/** A senha como a voz deve ler: letras separadas e número sem zero à esquerda ("CG03" -> "C G 3") */
export function spokenTicket(appointment: Appointment): string {
  const code = ticketCode(appointment);
  const letters = code.match(/[A-Z]+/)?.[0] ?? "";
  return `${letters.split("").join(" ")} ${Number(code.slice(letters.length))}`;
}

/** Número do consultório: posição do profissional na lista (em ordem alfabética) de quem atende. Igual em todas as janelas. */
export function roomNumber(professional: string, appointments: Appointment[]): number {
  const names = [...new Set(appointments.map(a => a.professional))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const index = names.indexOf(professional);
  return index < 0 ? 1 : index + 1;
}

/** Quem está na recepção, na ordem de chegada (empate: horário marcado, depois o id) */
export function waitingQueue(appointments: Appointment[], date: string): Appointment[] {
  return appointments
    .filter(a => a.date === date && a.status === "chegou")
    .sort((a, b) => (a.checkInAt ?? a.time).localeCompare(b.checkInAt ?? b.time) || a.time.localeCompare(b.time) || a.id - b.id);
}

/** Quem está sendo atendido agora, por horário */
export function inService(appointments: Appointment[], date: string): Appointment[] {
  return appointments
    .filter(a => a.date === date && a.status === "em_atendimento")
    .sort((a, b) => a.time.localeCompare(b.time) || a.id - b.id);
}

/** Consultas que acabaram de ser chamadas: estão em atendimento agora e antes não estavam */
export function detectNewCalls(previous: Appointment[], next: Appointment[]): Appointment[] {
  const wasInService = new Set(previous.filter(a => a.status === "em_atendimento").map(a => a.id));
  return next.filter(a => a.status === "em_atendimento" && !wasInService.has(a.id));
}

/**
 * Últimas chamadas para a grade do painel, da mais nova para a mais antiga.
 * Primeiro as que o painel viu acontecer; depois quem já estava em atendimento quando ele abriu (do horário mais tarde para o mais cedo).
 */
export function recentCalls(history: Appointment[], inServiceNow: Appointment[], limit = 8): Appointment[] {
  const seen = new Set(history.map(a => a.id));
  const earlier = inServiceNow.filter(a => !seen.has(a.id)).sort((a, b) => b.time.localeCompare(a.time) || b.id - a.id);
  return [...history, ...earlier].slice(0, limit);
}

/** Frase falada na chamada */
export function callAnnouncement(appointment: Appointment, room: number): string {
  return `Senha ${spokenTicket(appointment)}. ${publicName(appointment.patient.name)}, consultório ${room}, com ${appointment.professional}.`;
}
