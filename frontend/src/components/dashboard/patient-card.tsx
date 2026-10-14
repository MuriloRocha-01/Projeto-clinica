"use client";

import Link from "next/link";
import { Check, Clock3, Mail, Phone } from "lucide-react";
import { nextAppointmentStatus } from "@/services/appointment-workflow";
import { formatMoney } from "@/services/billing";
import { attendanceLabels, statusLabels, statusStyles, type Appointment, type AppointmentStatus } from "@/types/dashboard";

const actionLabels: Partial<Record<AppointmentStatus, string>> = {
  agendado: "Check-in (Recepção)", confirmado: "Check-in (Recepção)",
  chegou: "Chamar / Atender", em_atendimento: "Finalizar Consulta",
};

export function PatientCard({ appointment, onAction, financial = false }: {
  appointment: Appointment;
  financial?: boolean;
  onAction: (appointment: Appointment, target: AppointmentStatus) => void;
}) {
  const target = nextAppointmentStatus[appointment.status];
  const canCancel = appointment.status !== "concluido" && appointment.status !== "cancelado";
  return (
    <li className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <article aria-label={`Consulta de ${appointment.patient.name} às ${appointment.time}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">{appointment.patient.initials}</span>
            <div className="min-w-0"><Link href={`/dashboard/pacientes/${appointment.patient.id}`} className="rounded font-bold text-slate-900 hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-blue-600">{appointment.patient.name}</Link><p className="mt-1 text-xs text-slate-500">Consulta #{appointment.id}</p></div>
          </div>
          <span key={appointment.status} className={`appointment-status inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[appointment.status]}`}><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{statusLabels[appointment.status]}</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2 text-sm text-slate-500">
            <p className="flex items-start gap-2"><Mail size={16} aria-hidden="true" className="mt-0.5 shrink-0" /><span className="break-all">{appointment.patient.email || "E-mail não informado"}</span></p>
            <p className="flex items-center gap-2"><Phone size={16} aria-hidden="true" />{appointment.patient.phone || "Telefone não informado"}</p>
          </div>
          <div><p className="text-sm font-semibold text-slate-700">{appointment.professional}</p><p className="mt-1 text-xs text-slate-500">{appointment.specialty}</p><p className="mt-2 text-xs font-medium text-blue-700">{appointment.attendanceType === "particular" ? "Particular" : `Convênio · ${attendanceLabels[appointment.attendanceType]}`}</p></div>
        </div>
        {financial && <p className="mt-4 text-sm font-bold text-slate-800">Valor da consulta: {formatMoney(appointment.amountCents)}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 text-blue-700"><Clock3 size={18} aria-hidden="true" /><time className="text-lg font-bold" dateTime={`${appointment.date}T${appointment.time}`}>{appointment.time}</time>{appointment.checkInAt && <span className="text-xs text-slate-500">Chegou às {appointment.checkInAt}</span>}</div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            {canCancel && <button type="button" onClick={() => onAction(appointment, "cancelado")} className="rounded-xl border border-rose-200 px-3 py-2.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-600">Desmarcar / Cancelar<span className="sr-only"> consulta de {appointment.patient.name}</span></button>}
            {target && <button type="button" onClick={() => onAction(appointment, target)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600"><Check size={15} aria-hidden="true" />{actionLabels[appointment.status]}<span className="sr-only"> · {appointment.patient.name}</span></button>}
          </div>
        </div>
      </article>
    </li>
  );
}
