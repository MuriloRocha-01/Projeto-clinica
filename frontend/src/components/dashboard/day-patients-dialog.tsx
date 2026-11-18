"use client";


import { useState, type RefObject } from "react";
import { CalendarDays, Search, Users, X } from "lucide-react";
import { useClinic } from "@/components/clinic-provider";
import { controlStyles } from "@/components/ui/field";
import { PatientCard } from "./patient-card";
import { useAppointmentActions } from "./use-appointment-actions";
import { statusLabels, type AppointmentStatus } from "@/types/dashboard";

type StatusFilter = AppointmentStatus | "all";
type AttendanceFilter = "all" | "particular" | "insurance";
const pageSize = 6;
const field = controlStyles;
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
    }} className="overview-dialog fixed inset-0 m-auto max-h-[94dvh] w-[calc(100%-1rem)] max-w-4xl overflow-auto rounded-2xl border border-line/80 bg-canvas p-0 text-ink shadow-2xl backdrop:bg-ink/45 backdrop:backdrop-blur-sm sm:max-h-[90dvh] sm:w-[calc(100%-3rem)]">
      <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line/80 bg-white p-5 sm:p-6">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-600">Gestão de atendimentos</p><h2 id="day-patients-title" className="text-lg font-bold sm:text-2xl">Pacientes do Dia <span className="font-normal text-muted">• Filtro Ativo</span></h2><p id="day-patients-description" className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted"><CalendarDays size={16} aria-hidden="true" />{dateLabel}<span aria-hidden="true">·</span>{patientCount} paciente(s) · {filtered.length} consulta(s)</p></div>
        <button autoFocus type="button" onClick={() => dialogRef.current?.close()} aria-label="Fechar pacientes do dia" className="shrink-0 rounded-xl p-2.5 text-muted hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand-600"><X size={22} aria-hidden="true" /></button>
      </header>
      <div className="space-y-4 p-4 sm:p-6">
        <section aria-label="Filtros de pacientes" className="rounded-2xl border border-line/80 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
            <label className="block text-xs font-semibold text-ink-soft">Buscar paciente ou profissional<div className="relative mt-2"><Search size={16} aria-hidden="true" className="absolute left-3 top-3 text-muted" /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Nome, e-mail ou telefone" className={`${field} pl-9`} /></div></label>
            <label className="block text-xs font-semibold text-ink-soft">Status<select value={status} onChange={event => { setStatus(event.target.value as StatusFilter); setPage(1); }} className={`${field} mt-2`}><option value="all">Todos os status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="block text-xs font-semibold text-ink-soft">Tipo de atendimento<select value={attendance} onChange={event => { setAttendance(event.target.value as AttendanceFilter); setPage(1); }} className={`${field} mt-2`}><option value="all">Todos os atendimentos</option><option value="particular">Particular</option><option value="insurance">Convênio</option></select></label>
          </div>
          {(search || status !== "all" || attendance !== "all") && <button type="button" onClick={resetFilters} className="mt-3 rounded text-xs font-semibold text-brand-600 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-brand-600">Limpar filtros</button>}
        </section>
        <p role="status" aria-live="polite" aria-atomic="true" className={feedback.text ? `rounded-xl border p-3 text-sm ${feedback.error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-brand-100 bg-brand-50 text-brand-800"}` : "sr-only"}>{feedback.text}</p>
        {rows.length ? <ul className="space-y-3">{rows.map(item => <PatientCard key={item.id} appointment={item} onAction={changeStatus} />)}</ul> : <div className="rounded-2xl border border-dashed border-line-strong py-12 text-center"><Users size={32} aria-hidden="true" className="mx-auto mb-3 text-muted" /><p className="font-semibold text-ink-soft">Nenhum paciente encontrado</p><p className="mt-2 text-sm text-muted">Ajuste os filtros ou selecione outra data na Visão Geral.</p></div>}
        {pages > 1 && <nav aria-label="Paginação de consultas" className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted"><span>Página {currentPage} de {pages}</span><div className="flex gap-2"><button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className={`${field} disabled:cursor-not-allowed disabled:opacity-40`}>Anterior</button><button type="button" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} className={`${field} disabled:cursor-not-allowed disabled:opacity-40`}>Próxima</button></div></nav>}
      </div>
      <footer className="border-t border-line/80 bg-white px-5 py-4 text-xs leading-5 text-muted">Demonstração interativa · Alterações compartilhadas com a agenda nesta sessão e descartadas ao recarregar.</footer>
    </dialog>
  );
}
