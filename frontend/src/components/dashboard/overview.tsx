import { useRef, useState } from "react";
import { OverviewDetails } from "./overview-details";
import type { Appointment, AppointmentStatus, DashboardMetric } from "@/types/dashboard";
import { MetricCard } from "./metric-card";
import { BillingSummary } from "./billing-summary";
import { DayPatientsDialog } from "./day-patients-dialog";
import { OverviewCharts } from "./overview-charts";

export function Overview({ appointments: day }: { appointments: Appointment[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const patientsDialog = useRef<HTMLDialogElement>(null);
  const [details, setDetails] = useState<{ title: string; items: Appointment[]; patients?: boolean; financial?: boolean }>({ title: "", items: [] });
  function openDetails(title: string, items: Appointment[], patients = false, financial = false) {
    if (patients) { patientsDialog.current?.showModal(); return; }
    setDetails({ title, items, patients, financial });
    dialog.current?.showModal();
  }
  const count = (status: AppointmentStatus) => day.filter(a => a.status === status).length;
  const metrics: DashboardMetric[] = [
    { label: "Pacientes do dia", value: new Set(day.map(a => a.patient.id)).size, description: "Pessoas com horário marcado", icon: "patients" },
    { label: "Agendamentos", value: day.length, description: `${count("confirmado")} confirmados para hoje`, icon: "appointments", featured: true },
    { label: "Na recepção", value: count("chegou"), description: "Aguardando serem chamados", icon: "queue" },
    { label: "Atendimentos concluídos", value: count("concluido"), description: `${count("em_atendimento")} em atendimento agora`, icon: "completed" },
  ];
  return <div className="space-y-6">
        <section aria-label="Métricas do dia" className="grid grid-cols-2 gap-4 lg:grid-cols-4">{metrics.map(metric => <MetricCard key={metric.label} metric={metric} onClick={() => openDetails(metric.label, metric.icon === "queue" ? day.filter(a => a.status === "chegou") : metric.icon === "completed" ? day.filter(a => a.status === "concluido") : day, metric.icon === "patients")} />)}</section>
        <OverviewCharts appointments={day} />
        <BillingSummary appointments={day} onDetails={(title, items) => openDetails(title, items, false, true)} />
        <OverviewDetails dialogRef={dialog} {...details} />
        <DayPatientsDialog dialogRef={patientsDialog} />
  </div>;
}
