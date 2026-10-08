import type { Appointment, AppointmentStatus, DashboardMetric } from "@/types/dashboard";
import { MetricCard } from "./metric-card";
import { BillingSummary } from "./billing-summary";

export function Overview({ appointments: day }: { appointments: Appointment[] }) {
  const count = (status: AppointmentStatus) => day.filter(a => a.status === status).length;
  const metrics: DashboardMetric[] = [
    { label: "Pacientes do dia", value: new Set(day.map(a => a.patient.id)).size, description: "Pessoas com horário marcado", icon: "patients" },
    { label: "Agendamentos", value: day.length, description: `${count("confirmado")} confirmados para hoje`, icon: "appointments", featured: true },
    { label: "Na recepção", value: count("chegou"), description: "Aguardando serem chamados", icon: "queue" },
    { label: "Atendimentos concluídos", value: count("concluido"), description: `${count("em_atendimento")} em atendimento agora`, icon: "completed" },
  ];
  return <div className="space-y-6">
        <section aria-label="Métricas do dia" className="grid grid-cols-2 gap-4 lg:grid-cols-4">{metrics.map(metric => <MetricCard key={metric.label} metric={metric} />)}</section>
        <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
          <section className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex items-start justify-between"><div><h2 className="text-sm font-bold">Movimento da agenda</h2><p className="mt-1 text-xs text-slate-500">Agendamentos por período do dia</p></div><span className="rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-500">{day.length} consultas</span></div><div className="mt-6 flex h-32 items-end justify-between gap-4 border-b border-slate-100 px-3">{[{ label: "08–10h", from: 8, to: 10 }, { label: "10–12h", from: 10, to: 12 }, { label: "12–14h", from: 12, to: 14 }, { label: "14–16h", from: 14, to: 16 }, { label: "16–18h", from: 16, to: 18 }].map((period, i) => { const total = day.filter(a => Number(a.time.slice(0, 2)) >= period.from && Number(a.time.slice(0, 2)) < period.to).length; return <div key={period.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-xs font-semibold text-slate-500">{total}</span><div aria-label={`${period.label}: ${total} consultas`} className={`w-full max-w-10 rounded-t-lg ${i === 1 ? "bg-blue-600" : "bg-blue-100"}`} style={{ height: `${Math.max(4, total * 23)}px`, maxHeight: "95px" }} /><span className="pb-2 text-[10px] text-slate-500">{period.label}</span></div>; })}</div></section>
          <section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-sm font-bold">Resumo dos atendimentos</h2><p className="mt-1 text-xs text-slate-500">Acompanhe o progresso da sua equipe</p><div className="mt-7 flex items-center gap-6"><div role="img" aria-label={`${count("concluido")} de ${day.length} atendimentos concluídos`} className="flex size-28 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#2563eb ${day.length ? count("concluido") / day.length * 360 : 0}deg, #eff6ff 0deg)` }}><div className="flex size-[86px] flex-col items-center justify-center rounded-full bg-white"><span className="text-2xl font-extrabold">{day.length ? Math.round(count("concluido") / day.length * 100) : 0}%</span><span className="text-[10px] text-slate-500">concluídos</span></div></div><div className="flex-1 space-y-3">{[{ label: "Concluídos", value: count("concluido"), color: "bg-blue-600" }, { label: "Em atendimento", value: count("em_atendimento"), color: "bg-violet-400" }, { label: "Aguardando", value: day.length - count("concluido") - count("em_atendimento"), color: "bg-slate-300" }].map(item => <div key={item.label} className="flex items-center gap-2 text-xs text-slate-500"><span className={`size-2 rounded-full ${item.color}`} /><span className="flex-1">{item.label}</span><span className="font-bold text-slate-800">{item.value}</span></div>)}</div></div></section>
        </div>
        <BillingSummary appointments={day} />
  </div>;
}
