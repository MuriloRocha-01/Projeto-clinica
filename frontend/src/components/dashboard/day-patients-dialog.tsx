"use client";


import { useState, type RefObject } from "react";
import { CalendarDays, Search, Users, X } from "lucide-react";
import { useClinic } from "@/components/clinic-provider";
import { PatientCard } from "./patient-card";
import { useAppointmentActions } from "./use-appointment-actions";
import { statusLabels, type AppointmentStatus } from "@/types/dashboard";

type StatusFilter = AppointmentStatus | "all";
type AttendanceFilter = "all" | "particular" | "insurance";
const pageSize = 6;
const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600";
export function DayPatientsDialog({ dialogRef }: { dialogRef: RefObject<HTMLDialogElement | null> }) {
  const { appointments, date } = useClinic();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [attendance, setAttendance] = useState<AttendanceFilter>("all");
  const [page, setPage] = useState(1);
  const { feedback, changeStatus, clearFeedback } = useAppointmentActions();
  const query = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = appointments.filter(item => item.date === date
    && (status === "all" || item.status === status)
    && (attendance === "all" || (attendance === "particular" ? item.attendanceType === "particular" : item.attendanceType !== "particular"))
    && `${item.patient.name} ${item.patient.email} ${item.patient.phone} ${item.professional}`.toLocaleLowerCase("pt-BR").includes(query)
  ).sort((a, b) => a.time.localeCompare(b.time) || a.id - b.id);
  const patientCount = new Set(filtered.map(item => item.patient.id)).size;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  function resetFilters() { setSearch(""); setStatus("all"); setAttendance("all"); setPage(1); }

  return (
    <dialog ref={dialogRef} aria-labelledby="day-patients-title" aria-describedby="day-patients-description" onClose={() => { resetFilters(); clearFeedback(); }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
    }} className="overview-dialog fixed inset-0 m-auto max-h-[94dvh] w-[calc(100%-1rem)] max-w-4xl overflow-auto rounded-2xl border border-slate-200/80 bg-slate-100 p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/45 backdrop:backdrop-blur-sm sm:max-h-[90dvh] sm:w-[calc(100%-3rem)]">
      <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200/80 bg-white p-5 sm:p-6">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600">Gestão de atendimentos</p><h2 id="day-patients-title" className="text-lg font-bold sm:text-2xl">Pacientes do Dia <span className="font-normal text-slate-500">• Filtro Ativo</span></h2><p id="day-patients-description" className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500"><CalendarDays size={16} aria-hidden="true" />{dateLabel}<span aria-hidden="true">·</span>{patientCount} paciente(s) · {filtered.length} consulta(s)</p></div>
        <button autoFocus type="button" onClick={() => dialogRef.current?.close()} aria-label="Fechar pacientes do dia" className="shrink-0 rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"><X size={22} aria-hidden="true" /></button>
      </header>
      <div className="space-y-4 p-4 sm:p-6">
        <section aria-label="Filtros de pacientes" className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
            <label className="block text-xs font-semibold text-slate-600">Buscar paciente ou profissional<div className="relative mt-2"><Search size={16} aria-hidden="true" className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Nome, e-mail ou telefone" className={`${field} pl-9`} /></div></label>
            <label className="block text-xs font-semibold text-slate-600">Status<select value={status} onChange={event => { setStatus(event.target.value as StatusFilter); setPage(1); }} className={`${field} mt-2`}><option value="all">Todos os status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="block text-xs font-semibold text-slate-600">Tipo de atendimento<select value={attendance} onChange={event => { setAttendance(event.target.value as AttendanceFilter); setPage(1); }} className={`${field} mt-2`}><option value="all">Todos os atendimentos</option><option value="particular">Particular</option><option value="insurance">Convênio</option></select></label>
          </div>
          {(search || status !== "all" || attendance !== "all") && <button type="button" onClick={resetFilters} className="mt-3 rounded text-xs font-semibold text-blue-600 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-600">Limpar filtros</button>}
        </section>
        <p role="status" aria-live="polite" aria-atomic="true" className={feedback.text ? `rounded-xl border p-3 text-sm ${feedback.error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-blue-100 bg-blue-50 text-blue-800"}` : "sr-only"}>{feedback.text}</p>
        {rows.length ? <ul className="space-y-3">{rows.map(item => <PatientCard key={item.id} appointment={item} onAction={changeStatus} />)}</ul> : <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center"><Users size={32} aria-hidden="true" className="mx-auto mb-3 text-slate-400" /><p className="font-semibold text-slate-700">Nenhum paciente encontrado</p><p className="mt-2 text-sm text-slate-500">Ajuste os filtros ou selecione outra data na Visão Geral.</p></div>}
        {pages > 1 && <nav aria-label="Paginação de consultas" className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"><span>Página {currentPage} de {pages}</span><div className="flex gap-2"><button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className={`${field} disabled:cursor-not-allowed disabled:opacity-40`}>Anterior</button><button type="button" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} className={`${field} disabled:cursor-not-allowed disabled:opacity-40`}>Próxima</button></div></nav>}
      </div>
      <footer className="border-t border-slate-200/80 bg-white px-5 py-4 text-xs leading-5 text-slate-500">Demonstração interativa · Alterações compartilhadas com a agenda nesta sessão e descartadas ao recarregar.</footer>
    </dialog>
  );
}
