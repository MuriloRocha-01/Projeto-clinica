import Link from "next/link";
import { X, ArrowUpRight, CalendarDays } from "lucide-react";
import type { RefObject } from "react";
import { attendanceLabels, statusLabels, statusStyles, type Appointment } from "@/types/dashboard";
import { formatMoney } from "@/services/billing";

export function OverviewDetails({ dialogRef, title, items, patients, financial }: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  title: string;
  items: Appointment[];
  patients?: boolean;
  financial?: boolean;
}) {
  const rows = patients ? [...new Map(items.map(item => [item.patient.id, item])).values()] : [...items].sort((a, b) => a.time.localeCompare(b.time));
  return <dialog ref={dialogRef} aria-labelledby="overview-details-title" aria-describedby="overview-details-description" className="overview-dialog fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-auto rounded-2xl border-0 bg-slate-50 p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/40" onClick={event => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
  }}>
    <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white p-6">
      <div><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600">Detalhes do dia</p><h2 id="overview-details-title" className="text-xl font-bold">{title}</h2><p id="overview-details-description" className="mt-2 text-sm text-slate-500">{rows.length} {patients ? "paciente(s)" : "agendamento(s)"} · Dados de demonstração</p></div>
      <button type="button" autoFocus onClick={() => dialogRef.current?.close()} aria-label="Fechar detalhes" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"><X size={20} /></button>
    </header>
    <div className="space-y-3 p-4 sm:p-6">
      {financial && <div className="rounded-xl bg-blue-50 p-4"><p className="text-sm text-blue-700">Total previsto</p><p className="mt-1 text-2xl font-bold text-blue-900">{formatMoney(items.reduce((sum, item) => sum + item.amountCents, 0))}</p><p className="mt-2 text-xs text-blue-700">Valores das consultas, sem confirmação de pagamento.</p></div>}
      {rows.length === 0 ? <div className="py-10 text-center"><CalendarDays className="mx-auto mb-3 text-slate-400" size={32} /><p className="font-semibold">Nenhum registro neste grupo</p><p className="mt-2 text-sm text-slate-500">Selecione outra data para consultar os atendimentos.</p></div> : <ul className="space-y-3">{rows.map(item => <li key={patients ? item.patient.id : item.id} className="rounded-xl border border-slate-100 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><Link href={`/dashboard/pacientes/${item.patient.id}`} className="flex items-center gap-2 font-semibold text-slate-900 hover:text-blue-600 focus-visible:outline-blue-600">{item.patient.name}<ArrowUpRight size={16} aria-hidden="true" /></Link>{!patients && <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status]}`}>{statusLabels[item.status]}</span>}</div>
        {patients ? <div className="mt-3 space-y-1 break-words text-sm text-slate-500"><p>{item.patient.phone}</p><p>{item.patient.email || "E-mail não informado"}</p></div> : <><p className="mt-3 text-sm text-slate-600">{item.time} · {item.professional}</p><p className="mt-1 text-xs text-slate-500">{item.specialty} · {attendanceLabels[item.attendanceType]}</p>{financial && <p className="mt-3 font-bold text-slate-900">{formatMoney(item.amountCents)}</p>}</>}
      </li>)}</ul>}
    </div>
  </dialog>;
}
