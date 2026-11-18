"use client";

import { useState } from "react";
import type { HealthMetric } from "@/types/clinical";

export function HealthAnalytics({ metrics }: { metrics: HealthMetric[] }) {
  const [selected, setSelected] = useState(metrics[0]?.id ?? "");
  const current = metrics.find(metric => metric.id === selected) ?? metrics[0];
  if (!current) return <section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="font-bold">Indicadores de saúde</h2><p className="mt-3 text-sm text-muted">Sem registros clínicos para este paciente.</p></section>;
  const minimum = Math.min(...current.readings) - 3;
  const maximum = Math.max(...current.readings) + 3;
  const points = current.readings.map((value, i) => `${40 + i * 80},${180 - (value - minimum) / (maximum - minimum) * 140}`).join(" ");
  return <section className="rounded-2xl bg-white p-6 shadow-sm">
    <div className="flex flex-wrap justify-between gap-2"><h2 className="text-lg font-bold">Indicadores de saúde</h2><span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">Dados fictícios · 08/10/2026</span></div>
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(metric => <button key={metric.id} onClick={() => setSelected(metric.id)} aria-pressed={selected === metric.id} className={`rounded-xl border p-3 text-left ${selected === metric.id ? "border-brand-300 bg-brand-50" : "border-line bg-soft hover:bg-white"}`}><span className="block text-xs text-muted">{metric.label}</span><span className="mt-2 block text-xl font-extrabold" style={{color:metric.color}}>{metric.value}</span><span className="text-xs text-muted">{metric.unit}</span></button>)}</div>
    <div className="mt-6 flex justify-between gap-2"><h3 className="text-sm font-semibold">Evolução · {current.label}</h3><span className="text-xs text-muted">7 registros simulados</span></div>
    <svg viewBox="0 0 560 215" role="img" aria-label={`${current.label}: ${current.readings.join(", ")} ${current.unit}. ${current.id === "pressure" ? "Gráfico da pressão sistólica." : ""}`} className="mt-4 w-full"><title>{`${current.label} · evolução fictícia`}</title>{[40, 80, 120, 160, 180].map(y => <line key={y} x1="40" x2="520" y1={y} y2={y} stroke="#E4E0D8" strokeDasharray="4 4" />)}<polyline points={points} fill="none" stroke={current.color} strokeWidth="3" strokeLinejoin="round" />{current.readings.map((value, i) => <g key={i}><circle cx={40+i*80} cy={180-(value-minimum)/(maximum-minimum)*140} r="4" fill={current.color} /><text x={40+i*80} y="204" textAnchor="middle" fontSize="10" fill="#4B5B4E">{String(i+2).padStart(2,"0")}/10</text></g>)}</svg>
    <p className="text-xs text-muted">{current.id === "pressure" ? "A linha representa apenas a pressão sistólica (mmHg)." : `Valores exibidos em ${current.unit}.`} Os pontos são registros de demonstração.</p>
  </section>;
}
