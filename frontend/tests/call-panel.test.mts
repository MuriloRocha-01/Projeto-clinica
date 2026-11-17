import assert from "node:assert/strict";
import { callAnnouncement, detectNewCalls, inService, publicName, recentCalls, roomNumber, spokenTicket, ticketCode, waitingQueue } from "../src/services/call-panel.ts";
import type { Appointment } from "../src/types/dashboard.ts";

const make = (id: number, name: string, status: Appointment["status"], time: string, checkInAt?: string, date = "2026-10-08", professional = "Dra. Ana Oliveira", specialty = "Clínica geral") =>
  ({ id, date, time, status, checkInAt, professional, specialty, patient: { id, name } }) as unknown as Appointment;

// nome público: sem o sobrenome inteiro
assert.equal(publicName("Juliana Santos"), "Juliana S.");
assert.equal(publicName("Ana de Souza Lima"), "Ana L.");
assert.equal(publicName("  Maria   "), "Maria");
assert.equal(publicName("joão silva"), "joão S.");
assert.equal(publicName(""), "Paciente");

// senha: letras da especialidade + número da consulta
assert.equal(ticketCode(make(3, "A A", "chegou", "10:00")), "CG03");
assert.equal(ticketCode(make(7, "A A", "chegou", "10:00", undefined, "2026-10-08", "Dr. Lucas Mendes", "Cardiologia")), "CA07");
assert.equal(ticketCode(make(12, "A A", "chegou", "10:00", undefined, "2026-10-08", "X", "Ginecologia e obstetrícia")), "GO12");
assert.equal(ticketCode(make(5, "A A", "chegou", "10:00", undefined, "2026-10-08", "X", "")), "AT05");
assert.equal(spokenTicket(make(3, "A A", "chegou", "10:00")), "C G 3");
assert.equal(spokenTicket(make(12, "A A", "chegou", "10:00", undefined, "2026-10-08", "Dr. Lucas Mendes", "Cardiologia")), "C A 12");

// consultório: posição do profissional em ordem alfabética, igual em qualquer janela
const doctors = [make(1, "A A", "concluido", "09:00"), make(2, "B B", "chegou", "10:00", undefined, "2026-10-08", "Dr. Lucas Mendes", "Cardiologia")];
assert.equal(roomNumber("Dr. Lucas Mendes", doctors), 1);
assert.equal(roomNumber("Dra. Ana Oliveira", doctors), 2);
assert.equal(roomNumber("Quem?", doctors), 1);

// fila da recepção: só "chegou" da data, por ordem de chegada
const list = [
  make(1, "A A", "concluido", "09:00", "08:48"),
  make(2, "B B", "chegou", "10:30", "09:55"),
  make(3, "C C", "chegou", "10:00", "09:42"),
  make(4, "D D", "chegou", "11:00", "09:42"),
  make(5, "E E", "chegou", "10:00", "09:30", "2026-10-09"),
  make(6, "F F", "em_atendimento", "09:30", "09:15"),
];
assert.deepEqual(waitingQueue(list, "2026-10-08").map(a => a.id), [3, 4, 2]);
assert.deepEqual(inService(list, "2026-10-08").map(a => a.id), [6]);
assert.deepEqual(waitingQueue([], "2026-10-08"), []);

// chamada nova: só quem entrou em atendimento agora
const before = [make(2, "B B", "chegou", "10:30", "09:55"), make(6, "F F", "em_atendimento", "09:30", "09:15")];
const after = [make(2, "B B", "em_atendimento", "10:30", "09:55"), make(6, "F F", "em_atendimento", "09:30", "09:15")];
assert.deepEqual(detectNewCalls(before, after).map(a => a.id), [2]);
assert.deepEqual(detectNewCalls(after, after), []);
assert.deepEqual(detectNewCalls(after, [make(7, "G G", "em_atendimento", "11:00")]).map(a => a.id), [7]);

// grade das últimas chamadas: as vistas pelo painel primeiro, depois quem já estava em atendimento
const nowInService = [make(6, "F F", "em_atendimento", "09:30"), make(8, "H H", "em_atendimento", "09:00"), make(2, "B B", "em_atendimento", "10:30")];
assert.deepEqual(recentCalls([make(2, "B B", "em_atendimento", "10:30")], nowInService).map(a => a.id), [2, 6, 8]);
assert.deepEqual(recentCalls([], nowInService).map(a => a.id), [2, 6, 8]);
assert.deepEqual(recentCalls([], nowInService, 2).map(a => a.id), [2, 6]);
assert.deepEqual(recentCalls([], []), []);

assert.equal(
  callAnnouncement(make(3, "Juliana Santos", "em_atendimento", "10:00"), 1),
  "Senha C G 3. Juliana S., consultório 1, com Dra. Ana Oliveira.",
);

console.log("call-panel ok");
