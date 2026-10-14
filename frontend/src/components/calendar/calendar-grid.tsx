"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { PatientCard } from "@/components/dashboard/patient-card";
import { useAppointmentActions } from "@/components/dashboard/use-appointment-actions";
import { ChevronLeft, ChevronRight, Clock3, MapPin, X } from "lucide-react";
import { calendarLanes, appointmentEnd, shiftDate, timeMinutes, weekDates } from "@/services/calendar";
import { attendanceLabels, statusLabels, type Appointment } from "@/types/dashboard";

const labelDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });
const startHour = 9;
const endHour = 16;
export function CalendarGrid({ appointments, date, onDateChange }: { appointments: Appointment[]; date: string; onDateChange: (date: string) => void }) {
  const [professional, setProfessional] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = appointments.find(item => item.id === selectedId);
  const { feedback, changeStatus, clearFeedback } = useAppointmentActions();
  const drawer = useRef<HTMLDialogElement>(null);
  const days = weekDates(date);
  const week = appointments.filter(a => days.includes(a.date) && (professional === "all" || a.professional === professional));
  const outside = week.filter(a => timeMinutes(a.time) < startHour * 60 || timeMinutes(a.time) + (a.durationMinutes ?? 30) > endHour * 60);
  const visible = week.filter(a => !outside.includes(a));
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const doctors = [...new Set(appointments.map(a => a.professional))];
  function open(appointment: Appointment) { setSelectedId(appointment.id); drawer.current?.showModal(); }

  return <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
      <div className="flex items-center gap-3"><h2 className="text-lg font-bold">{labelDate(days[0])} — {labelDate(days[5])}</h2><button onClick={() => onDateChange(shiftDate(date, -7))} aria-label="Semana anterior" className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"><ChevronLeft size={16} /></button><button onClick={() => onDateChange(shiftDate(date, 7))} aria-label="Próxima semana" className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"><ChevronRight size={16} /></button></div>
      <label className="text-sm"><span className="sr-only">Profissional da agenda</span><select value={professional} onChange={e => setProfessional(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="all">Todos os profissionais</option>{doctors.map(name => <option key={name}>{name}</option>)}</select></label>
    </header>
    <div className="overflow-x-auto" tabIndex={0} aria-label="Grade semanal, use a rolagem para visualizar os dias">
      <div className="min-w-[1120px]">
        <div className="grid grid-cols-[72px_repeat(6,minmax(0,1fr))] border-b border-slate-100 bg-slate-50/70"><div className="p-4 text-xs text-slate-500">Horário</div>{days.map((day, i) => <div key={day} className={`border-l border-slate-100 px-3 py-4 text-center text-xs ${day === date ? "bg-blue-50 font-bold text-blue-700" : "text-slate-500"}`}><span>{["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][i]}</span><span className="ml-2">{labelDate(day)}</span></div>)}</div>
        <div className="grid grid-cols-[72px_repeat(6,minmax(0,1fr))]">
          <div>{hours.map(hour => <div key={hour} className="h-[144px] border-b border-slate-100 px-3 pt-3 text-xs font-semibold text-slate-500">{String(hour).padStart(2, "0")}:00</div>)}</div>
          {days.map(day => { const daily = visible.filter(a => a.date === day); const lanes = calendarLanes(daily); return <div key={day} className="relative border-l border-slate-100" style={{ height: hours.length * 144 }}>{hours.map(hour => <div key={hour} className="h-[144px] border-b border-slate-100"><div className="h-[72px] border-b border-dashed border-slate-100" /></div>)}
            {daily.map(a => { const position = lanes[a.id]; return <button key={a.id} onClick={() => open(a)} aria-label={`${a.patient.name}, ${a.time} até ${appointmentEnd(a)}, ${a.condition ?? a.specialty}`} className="absolute overflow-hidden rounded-xl border border-blue-200 bg-blue-50 p-1.5 text-left shadow-sm hover:border-blue-500 hover:bg-blue-100 focus:z-10" style={{ top: (timeMinutes(a.time) - startHour * 60) / 60 * 144 + 3, height: (a.durationMinutes ?? 30) / 60 * 144 - 6, left: `calc(${position.lane / position.count * 100}% + 4px)`, width: `calc(${100 / position.count}% - 8px)` }}><span className="flex items-center gap-2"><span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-[9px] font-bold text-blue-600">{a.patient.initials}</span><span className="truncate text-[11px] font-bold text-slate-800">{a.patient.name}</span></span><span className="mt-0.5 block truncate text-[10px] leading-3 text-slate-600">{a.condition ?? a.specialty}</span><span className="mt-0.5 block text-[10px] leading-3 font-semibold text-blue-700">{a.time} – {appointmentEnd(a)}</span></button>; })}
          </div>; })}
        </div>
      </div>
    </div>
    {week.length === 0 && <p role="status" className="px-5 py-4 text-sm text-slate-500">Nenhum agendamento nesta semana.</p>}
    {outside.length > 0 && <div className="border-t border-slate-100 p-5"><h3 className="text-sm font-bold">Fora do intervalo da grade</h3><div className="mt-3 flex flex-wrap gap-2">{outside.map(a => <button key={a.id} onClick={() => open(a)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs hover:bg-slate-50">{a.patient.name} · {labelDate(a.date)} · {a.time}–{appointmentEnd(a)}</button>)}</div></div>}
    <dialog ref={drawer} onClose={() => { setSelectedId(null); clearFeedback(); }} aria-labelledby="appointment-title" className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-xl overflow-auto border-0 bg-white p-6 shadow-xl backdrop:bg-slate-900/30 backdrop:backdrop-blur-sm"><div className="flex items-center justify-between"><h2 id="appointment-title" className="font-bold">Detalhes da consulta</h2><button onClick={() => drawer.current?.close()} aria-label="Fechar detalhes" className="rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button></div><p role="status" aria-live="polite" className={feedback.text ? `mt-4 rounded-xl p-3 text-sm ${feedback.error ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"}` : "sr-only"}>{feedback.text}</p>{selected && <div className="mt-8"><span className="flex size-14 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">{selected.patient.initials}</span><h3 className="mt-4 text-xl font-extrabold">{selected.patient.name}</h3><p className="mt-1 text-sm text-slate-500">{selected.condition ?? selected.specialty}</p><dl className="mt-6 space-y-5 text-sm"><div><dt className="text-xs text-slate-500">ID do agendamento</dt><dd className="mt-1 font-semibold">#{selected.id.toString().padStart(6, "0")}</dd></div><div><dt className="text-xs text-slate-500">Data e horário</dt><dd className="mt-1 flex items-center gap-2"><Clock3 size={15} />{labelDate(selected.date)} · {selected.time}–{appointmentEnd(selected)}</dd></div><div><dt className="text-xs text-slate-500">Modalidade</dt><dd className="mt-1 flex items-center gap-2"><MapPin size={15} />{selected.modality === "video" ? "Videoconsulta" : "Presencial"}</dd></div><div><dt className="text-xs text-slate-500">Profissional / atendimento</dt><dd className="mt-1">{selected.professional}<span className="mt-1 block">{attendanceLabels[selected.attendanceType]} · {statusLabels[selected.status]}</span></dd></div></dl><ul className="mt-6"><PatientCard appointment={selected} onAction={changeStatus} /></ul><Link href={`/dashboard/pacientes/${selected.patient.id}`} onClick={() => drawer.current?.close()} className="mt-8 block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-blue-700">Ver Ficha do Paciente</Link></div>}</dialog>
  </section>;
}

