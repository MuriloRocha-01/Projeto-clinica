"use client";

import { useState } from "react";
import { ArrowDownToLine, Search } from "lucide-react";
import { QueueTable } from "./queue-table";
import { attendanceLabels, statusLabels, type Appointment, type AppointmentStatus, type AttendanceType } from "@/types/dashboard";

const field = "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-blue-500";

export function PatientTableView({ appointments, professionals, mode, onTransition, onPatient }: {
  appointments: Appointment[];
  professionals: string[];
  mode: "queue" | "patients";
  onTransition: (id: number) => void;
  onPatient: (appointment: Appointment) => void;
}) {
  const [search, setSearch] = useState("");
  const [professional, setProfessional] = useState("all");
  const [status, setStatus] = useState<AppointmentStatus | "all">("all");
  const [attendance, setAttendance] = useState<AttendanceType | "all">("all");
  const filtered = appointments.filter(a => (professional === "all" || a.professional === professional)
    && (status === "all" || a.status === status) && (attendance === "all" || a.attendanceType === attendance)
    && `${a.patient.name} ${a.patient.phone}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")));
  const order: Record<AppointmentStatus, number> = { em_atendimento: 0, chegou: 1, confirmado: 2, agendado: 2, concluido: 3 };
  const rows = [...filtered].sort((a, b) => mode === "patients" ? a.patient.name.localeCompare(b.patient.name, "pt-BR")
    : order[a.status] - order[b.status] || (a.status === "chegou" && b.status === "chegou" ? (a.checkInAt ?? a.time).localeCompare(b.checkInAt ?? b.time) : a.time.localeCompare(b.time)));

  function exportRows() {
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const data = [["Paciente", "Telefone", "E-mail", "Data", "Horário", "Profissional", "Status", "Atendimento", "Valor (BRL)"],
      ...rows.map(a => [a.patient.name, a.patient.phone, a.patient.email, a.date, a.time, a.professional, statusLabels[a.status], attendanceLabels[a.attendanceType], Number.isSafeInteger(a.amountCents) ? (a.amountCents / 100).toFixed(2).replace(".", ",") : ""])];
    const url = URL.createObjectURL(new Blob(["\uFEFF" + data.map(row => row.map(escape).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${mode}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  return <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
    <header className="flex flex-wrap items-center justify-between gap-4 p-6"><div><h2 className="text-lg font-bold">{mode === "queue" ? "Fila de atendimento" : "Tabela de pacientes"}</h2><p className="mt-1 text-sm text-slate-500">{mode === "queue" ? "Acompanhe a chegada e cada etapa do atendimento." : "Consulte os pacientes e edite suas fichas na data selecionada."}</p></div><button onClick={exportRows} className={`${field} flex items-center gap-2 font-semibold hover:bg-slate-50`}><ArrowDownToLine size={16} />Exportar tabela</button></header>
    <div className="flex flex-wrap gap-3 px-6 pb-6">
      <label className="relative min-w-48 flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><span className="sr-only">Buscar paciente ou telefone</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..." className={`${field} w-full pl-9`} /></label>
      <label><span className="sr-only">Filtrar profissional</span><select value={professional} onChange={e => setProfessional(e.target.value)} className={field}><option value="all">Todos os profissionais</option>{professionals.map(name => <option key={name}>{name}</option>)}</select></label>
      <label><span className="sr-only">Filtrar status</span><select value={status} onChange={e => setStatus(e.target.value as AppointmentStatus | "all")} className={field}><option value="all">Todos os status</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label><span className="sr-only">Filtrar tipo de atendimento</span><select value={attendance} onChange={e => setAttendance(e.target.value as AttendanceType | "all")} className={field}><option value="all">Particular e convênios</option>{Object.entries(attendanceLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    </div>
    <QueueTable appointments={rows} onTransition={onTransition} onPatient={onPatient} />
    <footer className="flex flex-wrap justify-between gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-500"><span>{rows.length} de {appointments.length} agendamentos</span><span>Atualizações locais nesta sessão</span></footer>
  </section>;
}
