"use client";

import { useState, type FormEvent } from "react";
import { attendanceLabels, statusLabels, statusStyles, type Appointment, type AttendanceType } from "@/types/dashboard";
import { parseMoney } from "@/services/billing";

const field = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 focus:outline-blue-500";
export function PatientForm({ appointment, professionals, onSave, onCancel }: {
  appointment: Appointment;
  professionals: string[];
  onSave: (updated: Appointment) => string | null;
  onCancel: () => void;
}) {
  const [attendanceType, setAttendanceType] = useState<AttendanceType>(appointment.attendanceType ?? "particular");
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const amountCents = parseMoney(String(data.get("amount") ?? "").trim());
    const professional = String(data.get("professional") ?? "");
    const date = String(data.get("date") ?? "");
    const time = String(data.get("time") ?? "");
    if (!name || !phone || !date || !time || !professionals.includes(professional)) { setError("Preencha todos os campos obrigatórios."); return; }
    if (amountCents === null) { setError("Informe um valor válido, com até duas casas decimais."); return; }
    const result = onSave({ ...appointment, attendanceType, amountCents, professional, date, time,
      patient: { ...appointment.patient, name, phone, email: String(data.get("email") ?? "").trim(), initials: name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() },
    });
    if (result) setError(result);
  }
  return <form onSubmit={submit} className="mt-5 space-y-4">
    <p className="text-xs text-slate-500">Edite os dados e salve as alterações nesta demonstração.</p>
    <label className="block text-xs font-semibold text-slate-600">Nome do paciente<input autoFocus required name="name" maxLength={120} defaultValue={appointment.patient.name} className={field} /></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-xs font-semibold text-slate-600">Tipo de atendimento<select value={attendanceType} onChange={e => setAttendanceType(e.target.value as AttendanceType)} className={field}>{Object.entries(attendanceLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="block text-xs font-semibold text-slate-600">Valor da consulta (R$)<input required name="amount" inputMode="decimal" maxLength={12} defaultValue={Number.isSafeInteger(appointment.amountCents) ? (appointment.amountCents / 100).toFixed(2).replace(".", ",") : ""} placeholder="0,00" className={field} /></label>
      <label className="block text-xs font-semibold text-slate-600">Telefone<input required name="phone" type="tel" maxLength={25} defaultValue={appointment.patient.phone} className={field} /></label>
      <label className="block text-xs font-semibold text-slate-600">E-mail (opcional)<input name="email" type="email" maxLength={254} defaultValue={appointment.patient.email} className={field} /></label>
    </div>
    <label className="block text-xs font-semibold text-slate-600">Profissional<select name="professional" defaultValue={appointment.professional} className={field}>{professionals.map(name => <option key={name}>{name}</option>)}</select></label>
    <div className="grid grid-cols-2 gap-4">
      <label className="block text-xs font-semibold text-slate-600">Data da consulta<input required name="date" type="date" defaultValue={appointment.date} className={field} /></label>
      <label className="block text-xs font-semibold text-slate-600">Horário da consulta<input required name="time" type="time" defaultValue={appointment.time} className={field} /></label>
    </div>
    <span className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[appointment.status]}`}>{statusLabels[appointment.status]}</span>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <div className="flex gap-3 pt-2"><button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button><button type="submit" className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Salvar alterações</button></div>
  </form>;
}
