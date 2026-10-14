"use client";

import { CalendarDays, X } from "lucide-react";
import { useState, type RefObject } from "react";
import { useClinic } from "@/components/clinic-provider";
import type { Appointment } from "@/types/dashboard";
import { formatMoney } from "@/services/billing";
import { PatientCard } from "./patient-card";
import { useAppointmentActions } from "./use-appointment-actions";

export function OverviewDetails({ dialogRef, title, items, patients, financial }: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  title: string;
  items: Appointment[];
  patients?: boolean;
  financial?: boolean;
}) {
  const { appointments, date } = useClinic();
  const { feedback, changeStatus, clearFeedback } = useAppointmentActions();
  const [page, setPage] = useState(1);
  const ids = new Set(items.map(item => item.id));
  // Mantém o grupo aberto, mas resolve os dados atuais pelo ID a cada atualização.
  const rows = appointments.filter(item => ids.has(item.id)).sort((a, b) => a.time.localeCompare(b.time) || a.id - b.id);
  const patientCount = new Set(rows.map(item => item.patient.id)).size;
  const pages = Math.max(1, Math.ceil(rows.length / 6));
  const currentPage = Math.min(page, pages);
  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
  const total = rows.filter(item => item.status !== "cancelado").reduce((sum, item) => sum + item.amountCents, 0);
  return <dialog ref={dialogRef} aria-labelledby="overview-details-title" aria-describedby="overview-details-description" onClose={() => { clearFeedback(); setPage(1); }} className="overview-dialog fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-auto rounded-2xl border border-slate-200/80 bg-slate-100 p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm" onClick={event => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
  }}>
    <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200/80 bg-white p-5 sm:p-6">
      <div><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600">Detalhes do dia</p><h2 id="overview-details-title" className="text-xl font-bold">{title}</h2><p id="overview-details-description" className="mt-2 text-sm text-slate-500">{dateLabel} · {patients ? patientCount : rows.length} {patients ? "paciente(s)" : "agendamento(s)"}</p></div>
      <button type="button" autoFocus onClick={() => dialogRef.current?.close()} aria-label="Fechar detalhes" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"><X size={20} aria-hidden="true" /></button>
    </header>
    <div className="space-y-4 p-4 sm:p-6">
      {financial && <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="text-sm text-blue-700">Total previsto</p><p className="mt-1 text-2xl font-bold text-blue-900">{formatMoney(total)}</p><p className="mt-2 text-xs text-blue-700">Consultas não canceladas neste grupo, sem confirmação de pagamento.</p></div>}
      <p role="status" aria-live="polite" aria-atomic="true" className={feedback.text ? `rounded-xl border p-3 text-sm ${feedback.error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-blue-100 bg-blue-50 text-blue-800"}` : "sr-only"}>{feedback.text}</p>
      {rows.length === 0 ? <div className="py-10 text-center"><CalendarDays className="mx-auto mb-3 text-slate-400" size={32} aria-hidden="true" /><p className="font-semibold">Nenhum registro neste grupo</p><p className="mt-2 text-sm text-slate-500">Selecione outra data para consultar os atendimentos.</p></div> : <ul className="space-y-3">{rows.slice((currentPage - 1) * 6, currentPage * 6).map(item => <PatientCard key={item.id} appointment={item} onAction={changeStatus} financial={financial} />)}</ul>}
      {pages > 1 && <nav aria-label="Paginação dos detalhes" className="flex items-center justify-between gap-3 text-sm text-slate-500"><span>Página {currentPage} de {pages}</span><div className="flex gap-2"><button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 focus-visible:outline-blue-600 disabled:opacity-40">Anterior</button><button type="button" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 focus-visible:outline-blue-600 disabled:opacity-40">Próxima</button></div></nav>}
    </div>
    <footer className="border-t border-slate-200/80 bg-white px-5 py-4 text-xs leading-5 text-slate-500">Demonstração · Os pacientes do grupo aberto permanecem visíveis ao mudar de etapa. Alterações descartadas ao recarregar.</footer>
  </dialog>;
}
