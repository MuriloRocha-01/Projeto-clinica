"use client";


import { PatientDirectory } from "../patients/patient-directory";
import { useRef, useState, type FormEvent } from "react";
import { useClinic } from "@/components/clinic-provider";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarDays, Plus, X } from "lucide-react";
import { PatientForm } from "./patient-form";
import { Overview } from "./overview";
import { PatientTableView } from "./patient-table-view";
import { Navbar } from "@/components/layout/navbar";
import { appointmentsOverlap } from "@/services/calendar";
import { parseMoney } from "@/services/billing";

import { nextStatus } from "./queue-table";
import { attendanceLabels, type AttendanceType, statusLabels, type Appointment } from "@/types/dashboard";

const fieldClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-blue-500";
const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export function Dashboard({ view = "overview" }: { view?: "overview" | "queue" | "patients" }) {
  const {appointments, setAppointments, date, setDate} = useClinic();

  const [agendaMode, setAgendaMode] = useState<"calendar" | "queue">("calendar");
  const [newAttendanceType, setNewAttendanceType] = useState<AttendanceType>("particular");

  const [selectedPatient, setSelectedPatient] = useState<Appointment | null>(null);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const patientDialog = useRef<HTMLDialogElement>(null);
  const newDialog = useRef<HTMLDialogElement>(null);
  const professionals = [...new Set(appointments.map(a => a.professional))];
  const day = appointments.filter(a => a.date === date);

  function transition(id: number) {
    const current = appointments.find(a => a.id === id);
    if (!current) return;
    const status = nextStatus[current.status];
    if (!status) return;
    if (status === "em_atendimento" && appointments.some(a => a.date === current.date && a.professional === current.professional && a.status === "em_atendimento")) {
      setMessage("Este profissional já está em atendimento. Conclua o atendimento atual antes de chamar outro paciente."); return;
    }
    const time = new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
    setAppointments(items => items.map(a => a.id === id ? { ...a, status, checkInAt: status === "chegou" ? time : a.checkInAt } : a));
    setMessage(`${current.patient.name}: ${statusLabels[status].toLowerCase()}.`);
  }

  function openPatient(appointment: Appointment) { setSelectedPatient({ ...appointment }); patientDialog.current?.showModal(); }

  function savePatient(updated: Appointment): string | null {
    if (appointments.some(a => appointmentsOverlap(a, updated))) return "Esse horário já está ocupado para o profissional.";
    if (updated.status === "em_atendimento" && appointments.some(a => a.id !== updated.id && a.date === updated.date && a.professional === updated.professional && a.status === "em_atendimento")) return "Esse profissional já está em atendimento.";
    const specialty = appointments.find(a => a.professional === updated.professional)?.specialty ?? updated.specialty;
    setAppointments(items => items.map(a => a.id === updated.id ? { ...updated, specialty } : a.patient.id === updated.patient.id ? { ...a, patient: updated.patient } : a));
    setDate(updated.date);
    setMessage(`Ficha de ${updated.patient.name} atualizada na demonstração.`);
    patientDialog.current?.close(); setSelectedPatient(null);
    return null;
  }
  function createAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const time = String(data.get("time") ?? "");
    const appointmentDate = String(data.get("date") ?? "");
    const doctor = String(data.get("professional") ?? "");
    const amountCents = parseMoney(String(data.get("amount") ?? ""));
    if (amountCents === null) { setFormError("Informe um valor válido, com até duas casas decimais."); return; }
    if (!name || !phone || !time || !appointmentDate || !professionals.includes(doctor)) { setFormError("Preencha todos os campos obrigatórios."); return; }
    if (appointments.some(a => appointmentsOverlap(a, { date: appointmentDate, professional: doctor, time }))) { setFormError("Esse horário já está ocupado para o profissional."); return; }
    const id = Math.max(0, ...appointments.map(a => a.id)) + 1;
    setAppointments(items => [...items, { id, patient: { id, name, phone, email: String(data.get("email") ?? ""), initials: name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() }, professional: doctor, specialty: doctor === "Dra. Ana Oliveira" ? "Clínica geral" : "Cardiologia", attendanceType: newAttendanceType, amountCents, time, date: appointmentDate, status: "agendado" }]);
    setDate(appointmentDate); setMessage(`Agendamento de ${name} criado na demonstração.`);
    form.reset(); setFormError(""); newDialog.current?.close();
  }

  return <>
    <Navbar />
    <main id="main" className="mt-9 lg:mt-3">
    <section className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Seu dia, bem organizado</p><h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{view === "overview" ? "Visão geral" : view === "queue" ? "Agenda e fila de atendimento" : "Pacientes"}</h1><p className="mt-2 text-sm capitalize text-slate-500">{dateLabel(date)}</p></div><div className="flex flex-wrap items-center gap-3"><span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">Demonstração interativa</span>{view !== "overview" && <button onClick={() => { setFormError(""); newDialog.current?.showModal(); }} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={16} />Novo agendamento</button>}<label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><CalendarDays size={16} className="text-slate-500" /><span className="sr-only">Data da agenda</span><input type="date" value={date} onChange={event => setDate(event.target.value || "2026-10-08")} className="min-w-0 bg-transparent text-slate-700" /></label></div></section>
    {view === "overview" ? <Overview appointments={day} /> : view === "queue" ? <div className="space-y-5"><div className="inline-flex gap-1 rounded-xl bg-white p-1 shadow-sm">{(["calendar", "queue"] as const).map(mode => <button key={mode} aria-pressed={agendaMode === mode} onClick={() => setAgendaMode(mode)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${agendaMode === mode ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}>{mode === "calendar" ? "Grade semanal" : "Fila do dia"}</button>)}</div>{agendaMode === "calendar" ? <CalendarGrid appointments={appointments} date={date} onDateChange={setDate} /> : <PatientTableView appointments={day} professionals={professionals} mode="queue" onTransition={transition} onPatient={openPatient} />}</div> : <PatientDirectory appointments={appointments} /> }
    <p role="status" aria-live="polite" className={`mt-4 rounded-xl text-sm ${message ? "border border-blue-100 bg-blue-50 px-4 py-3 text-blue-800" : "sr-only"}`}>{message}</p>
    </main>
    <dialog ref={patientDialog} onClose={() => setSelectedPatient(null)} aria-labelledby="patient-title" className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-2xl border-0 p-6 shadow-xl backdrop:bg-slate-900/40">
      <div className="flex items-center justify-between"><h2 id="patient-title" className="text-lg font-bold">Ficha do paciente</h2><button onClick={() => patientDialog.current?.close()} aria-label="Fechar ficha" className="rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button></div>
      {selectedPatient && <PatientForm key={selectedPatient.id} appointment={selectedPatient} professionals={professionals} onSave={savePatient} onCancel={() => patientDialog.current?.close()} />}
    </dialog>
    <dialog ref={newDialog} aria-labelledby="new-title" className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-2xl border-0 p-6 shadow-xl backdrop:bg-slate-900/40"><div className="mb-5 flex items-center justify-between"><div><h2 id="new-title" className="text-lg font-bold">Novo agendamento</h2><p className="mt-1 text-xs text-slate-500">Cadastro local de demonstração</p></div><button onClick={() => newDialog.current?.close()} aria-label="Fechar formulário" className="rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button></div><form onSubmit={createAppointment} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-semibold text-slate-600">Tipo de atendimento<select name="attendanceType" value={newAttendanceType} onChange={e => setNewAttendanceType(e.target.value as AttendanceType)} className={`${fieldClass} mt-1.5`}>{Object.entries(attendanceLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="block text-xs font-semibold text-slate-600">{newAttendanceType === "particular" ? "Preço da consulta (R$)" : "Valor a faturar ao convênio (R$)"}<input required name="amount" type="text" inputMode="decimal" placeholder="0,00" maxLength={12} className={`${fieldClass} mt-1.5`} /></label></div><label className="block text-xs font-semibold text-slate-600">Nome do paciente<input autoFocus required maxLength={120} name="name" className={`${fieldClass} mt-1.5`} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-semibold text-slate-600">Telefone<input required type="tel" maxLength={25} name="phone" className={`${fieldClass} mt-1.5`} /></label><label className="block text-xs font-semibold text-slate-600">E-mail (opcional)<input type="email" name="email" className={`${fieldClass} mt-1.5`} /></label></div><label className="block text-xs font-semibold text-slate-600">Profissional<select name="professional" className={`${fieldClass} mt-1.5`}>{professionals.map(name => <option key={name}>{name}</option>)}</select></label><div className="grid grid-cols-2 gap-4"><label className="block text-xs font-semibold text-slate-600">Data<input required name="date" type="date" defaultValue={date} className={`${fieldClass} mt-1.5`} /></label><label className="block text-xs font-semibold text-slate-600">Horário<input required name="time" type="time" min="08:00" max="17:30" step="1800" className={`${fieldClass} mt-1.5`} /></label></div>{formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}<button type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Criar agendamento</button></form></dialog>
  </>;
}







