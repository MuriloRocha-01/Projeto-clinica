"use client";

import { useState, type FormEvent } from "react";
import { attendanceLabels, statusLabels, statusStyles, type Appointment, type AttendanceType } from "@/types/dashboard";
import { parseMoney } from "@/services/billing";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";

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
    <p className="text-xs text-muted">Edite os dados e salve as alterações nesta demonstração.</p>
    <Field label="Nome do paciente"><Input autoFocus required name="name" maxLength={120} defaultValue={appointment.patient.name} /></Field>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Tipo de atendimento"><Select value={attendanceType} onChange={e => setAttendanceType(e.target.value as AttendanceType)}>{Object.entries(attendanceLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></Field>
      <Field label="Valor da consulta (R$)"><Input required name="amount" inputMode="decimal" maxLength={12} defaultValue={Number.isSafeInteger(appointment.amountCents) ? (appointment.amountCents / 100).toFixed(2).replace(".", ",") : ""} placeholder="0,00" /></Field>
      <Field label="Telefone"><Input required name="phone" type="tel" maxLength={25} defaultValue={appointment.patient.phone} /></Field>
      <Field label="E-mail (opcional)"><Input name="email" type="email" maxLength={254} defaultValue={appointment.patient.email} /></Field>
    </div>
    <Field label="Profissional"><Select name="professional" defaultValue={appointment.professional}>{professionals.map(name => <option key={name}>{name}</option>)}</Select></Field>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Data da consulta"><Input required name="date" type="date" defaultValue={appointment.date} /></Field>
      <Field label="Horário da consulta"><Input required name="time" type="time" defaultValue={appointment.time} /></Field>
    </div>
    <span className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[appointment.status]}`}>{statusLabels[appointment.status]}</span>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <div className="flex gap-3 pt-2"><Button variant="secondary" size="lg" className="flex-1" onClick={onCancel}>Cancelar</Button><Button type="submit" size="lg" className="flex-1">Salvar alterações</Button></div>
  </form>;
}
