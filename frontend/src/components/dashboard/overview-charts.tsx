import type { Appointment } from "@/types/dashboard";

const periods = [
  { label: "08–10h", from: 8, to: 10 },
  { label: "10–12h", from: 10, to: 12 },
  { label: "12–14h", from: 12, to: 14 },
  { label: "14–16h", from: 14, to: 16 },
  { label: "16–18h", from: 16, to: 18 },
];

export function OverviewCharts({ appointments }: { appointments: Appointment[] }) {
  const completed = appointments.filter(item => item.status === "concluido").length;
  const inProgress = appointments.filter(item => item.status === "em_atendimento").length;
  const waiting = appointments.filter(item => item.status === "agendado" || item.status === "confirmado" || item.status === "chegou").length;
  const percentage = appointments.length ? completed / appointments.length * 100 : 0;

  return (
    <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
      <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="agenda-movement-title">
        <div className="flex items-start justify-between">
          <div><h2 id="agenda-movement-title" className="text-sm font-bold">Movimento da agenda</h2><p className="mt-1 text-xs text-slate-500">Agendamentos por período do dia</p></div>
          <span className="rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-500">{appointments.length} consultas</span>
        </div>
        <div className="mt-6 flex h-32 items-end justify-between gap-4 border-b border-slate-100 px-3">
          {periods.map((period, index) => {
            const total = appointments.filter(item => Number(item.time.slice(0, 2)) >= period.from && Number(item.time.slice(0, 2)) < period.to).length;
            return <div key={period.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2 rounded-lg">
              <span className="text-xs font-semibold text-slate-500">{total}</span>
              <div aria-hidden="true" className={`w-full max-w-10 rounded-t-lg ${index === 1 ? "bg-blue-600" : "bg-blue-100"}`} style={{ height: `${Math.max(4, total * 23)}px`, maxHeight: "95px" }} />
              <span className="pb-2 text-[10px] text-slate-500">{period.label}</span>
            </div>;
          })}
        </div>
      </section>
      <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="attendance-summary-title">
        <h2 id="attendance-summary-title" className="text-sm font-bold">Resumo dos atendimentos</h2>
        <p className="mt-1 text-xs text-slate-500">Acompanhe o progresso da sua equipe</p>
        <div className="mt-7 flex items-center gap-6">
          <div role="img" aria-label={`${completed} de ${appointments.length} atendimentos concluídos`} className="flex size-28 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#2563eb ${percentage * 3.6}deg, #eff6ff 0deg)` }}>
            <div aria-hidden="true" className="flex size-[86px] flex-col items-center justify-center rounded-full bg-white"><span className="text-2xl font-extrabold">{Math.round(percentage)}%</span><span className="text-[10px] text-slate-500">concluídos</span></div>
          </div>
          <dl className="flex-1 space-y-3">
            {[{ label: "Concluídos", value: completed, color: "bg-blue-600" }, { label: "Em atendimento", value: inProgress, color: "bg-violet-400" }, { label: "Aguardando", value: waiting, color: "bg-slate-300" }].map(item => (
              <div key={item.label} className="flex items-center gap-2 rounded-lg p-2 text-xs text-slate-500"><span aria-hidden="true" className={`size-2 rounded-full ${item.color}`} /><dt className="flex-1">{item.label}</dt><dd className="font-bold text-slate-800">{item.value}</dd></div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
