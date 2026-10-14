"use client";

import Link from "next/link";

import { ArrowLeft, CalendarDays, Heart, MapPin, Phone } from "lucide-react";
import { useClinic } from "@/components/clinic-provider";
import { Navbar } from "@/components/layout/navbar";
import { demoClinicalProfiles } from "@/services/clinical-data";
import { appointmentEnd } from "@/services/calendar";
import { HealthAnalytics } from "./health-analytics";
import { PepActions, PepHistory } from "./pep-workspace";
import { MedicalRecords } from "./medical-records";

export function PatientProfile({patientId}:{patientId:number}) {
  const {appointments,date}=useClinic();

  const history=appointments.filter(a => a.patient.id===patientId);
  const patient=history[0]?.patient;
  const clinical=demoClinicalProfiles[patientId];
  if (!patient) return <main className="mx-auto max-w-xl px-6 py-24"><h1 className="text-2xl font-bold">Paciente não encontrado</h1><p className="mt-3 text-sm text-slate-500">O paciente pode existir apenas em outra sessão da demonstração.</p><Link href="/dashboard/pacientes" className="mt-6 inline-block text-blue-600">Voltar aos pacientes</Link></main>;
  const upcoming=history.filter(a => a.date>=date && (a.status==="agendado" || a.status==="confirmado")).sort((a,b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const birth=clinical ? new Date(`${clinical.birthDate}T12:00:00Z`) : null;
  const reference=new Date(`${date}T12:00:00Z`);
  const age=birth ? reference.getUTCFullYear()-birth.getUTCFullYear()-Number(reference.getUTCMonth()<birth.getUTCMonth() || (reference.getUTCMonth()===birth.getUTCMonth() && reference.getUTCDate()<birth.getUTCDate())) : null;
  return <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-8 lg:px-10">
    <Navbar />
    <main className="mt-8 lg:mt-3"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><Link href="/dashboard/pacientes" className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><ArrowLeft size={14} />Voltar aos pacientes</Link><h1 className="text-3xl font-extrabold tracking-tight">{patient.name}</h1><p className="mt-2 text-sm text-slate-500">Perfil do paciente · prontuário demonstrativo</p></div><span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">Dados de saúde fictícios</span></div>
      <div className="grid items-start gap-6 xl:grid-cols-[220px_minmax(0,1fr)_280px] 2xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="space-y-6"><section className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">{patient.initials}</span><div><h2 className="font-bold">{patient.name}</h2><p className="mt-1 text-xs text-slate-500">{age===null ? "Idade não informada" : `${age} anos`} · {clinical?.gender ?? "Gênero não informado"}</p></div></div><dl className="mt-6 space-y-4 text-sm"><div><dt className="text-xs text-slate-500">ID do paciente</dt><dd className="mt-1 font-semibold">#{patient.id.toString().padStart(6,"0")}</dd></div><div><dt className="text-xs text-slate-500">Telefone</dt><dd className="mt-1 flex items-center gap-2"><Phone size={13} />{patient.phone}</dd></div><div><dt className="text-xs text-slate-500">E-mail</dt><dd className="mt-1 break-all">{patient.email || "Não informado"}</dd></div><div><dt className="text-xs text-slate-500">Contato de emergência</dt><dd className="mt-1">{clinical?.emergencyName ?? "Não informado"}<span className="mt-1 block text-xs text-slate-500">{clinical?.emergencyPhone}</span></dd></div><div><dt className="text-xs text-slate-500">Endereço</dt><dd className="mt-1 flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0" />{clinical?.address ?? "Não informado"}</dd></div></dl></section>
          <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-sm font-bold">Próximas consultas</h2><p className="mt-1 text-xs text-slate-500">A partir de {date.split("-").reverse().join("/")}</p><div className="mt-4 space-y-3">{upcoming.map(a => <article key={a.id} className="rounded-xl border border-blue-100 bg-blue-50 p-3"><h3 className="text-xs font-bold">{a.condition ?? a.specialty}</h3><p className="mt-1 text-[11px] text-slate-500">{a.professional}</p><p className="mt-3 flex items-center gap-1 text-[11px] text-blue-700"><CalendarDays size={12} />{a.date.split("-").reverse().join("/")} · {a.time}–{appointmentEnd(a)}</p></article>)}{upcoming.length===0 && <p className="text-xs text-slate-500">Nenhuma consulta futura registrada.</p>}</div></section>
        </aside>
        <div className="min-w-0 space-y-6"><HealthAnalytics metrics={clinical?.metrics ?? []} /><PepHistory patientId={patientId} /><MedicalRecords records={clinical?.records ?? {exams:[],consultations:[],medications:[]}} /></div>
        <aside className="space-y-6"><PepActions key={patientId} patientId={patientId} /><section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-sm font-bold">Notas anteriores · demonstração</h2><div className="mt-4 space-y-3">{clinical?.notes.map((note,index) => <article key={index} className="rounded-xl bg-slate-50 p-4"><p className="text-xs leading-6 text-slate-600">{note}</p><p className="mt-2 text-[10px] text-slate-400">Nota demonstrativa · 01/10/2026</p></article>) ?? <p className="text-xs text-slate-500">Sem notas registradas.</p>}</div></section>
          <section className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Heart size={16} className="text-blue-600" /><h2 className="text-sm font-bold">Bem-estar</h2></div><p className="mt-2 text-xs leading-5 text-slate-500">Pontuação fictícia para demonstrar o painel.</p>{clinical ? <><div role="img" aria-label={`Pontuação de demonstração: ${clinical.wellnessScore} de 100`} className="mx-auto my-6 flex size-40 items-center justify-center rounded-full" style={{background:`conic-gradient(#2563eb ${clinical.wellnessScore*3.6}deg,#eff6ff 0deg)`}}><div className="flex size-32 flex-col items-center justify-center rounded-full bg-white"><span className="text-4xl font-extrabold">{clinical.wellnessScore}</span><span className="mt-1 text-xs text-slate-500">de 100</span></div></div><p className="text-center text-xs text-slate-400">Sem cálculo ou avaliação clínica</p></> : <p className="mt-4 text-sm text-slate-500">Não informado</p>}</section>
        </aside>
      </div>
    </main>
  </div>;
}
