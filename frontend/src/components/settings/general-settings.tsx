"use client";

import { useState, type FormEvent } from "react";
import { Plus, Save } from "lucide-react";
import { useClinic } from "@/components/clinic-provider";
import { settingsField, primaryButton, secondaryButton } from "./settings-ui";

export function GeneralSettings() {
  const { settings, setSettings } = useClinic();
  const [types, setTypes] = useState(settings.consultationTypes);
  const [newType, setNewType] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; error: boolean }>({ text: "", error: false });
  function addType() {
    const name = newType.trim();
    if (!name || types.some(item => item.name.trim().toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) { setFeedback({ text: "Informe um nome de atendimento que ainda não esteja na lista.", error: true }); return; }
    setTypes(items => [...items, { id: crypto.randomUUID(), name, active: true }]); setNewType(""); setFeedback({ text: "Tipo adicionado ao formulário. Salve para confirmar.", error: false });
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const defaultDuration = Number(data.get("duration"));
    const cancellationHours = Number(data.get("cancellation"));
    const openingTime = String(data.get("opening") ?? "");
    const closingTime = String(data.get("closing") ?? "");
    const normalized = types.map(item => ({ ...item, name: item.name.trim() }));
    if (normalized.some(item => !item.name) || new Set(normalized.map(item => item.name.toLocaleLowerCase("pt-BR"))).size !== normalized.length || !normalized.some(item => item.active)) { setFeedback({ text: "Use nomes únicos e mantenha pelo menos um tipo de atendimento ativo.", error: true }); return; }
    if (!Number.isInteger(defaultDuration) || defaultDuration < 5 || defaultDuration > 240 || !Number.isInteger(cancellationHours) || cancellationHours < 0 || cancellationHours > 168 || !openingTime || !closingTime || openingTime >= closingTime) { setFeedback({ text: "Verifique a duração (5–240 min), o prazo (0–168 h) e o expediente de início e término.", error: true }); return; }
    setSettings(current => ({ ...current, consultationTypes: normalized, defaultDuration, cancellationHours, openingTime, closingTime }));
    setFeedback({ text: "Parâmetros salvos nesta sessão de demonstração.", error: false });
  }
  return <form onSubmit={save} className="space-y-5">
    <div><h2 className="text-xl font-bold">Parâmetros gerais</h2><p className="mt-1 text-sm text-slate-500">Defina o catálogo de atendimentos e as regras da operação.</p></div>
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><h3 className="font-bold">Tipos de atendimento</h3><p className="mt-1 text-xs text-slate-500">Edite os nomes e selecione os tipos aceitos pela clínica.</p><ul className="mt-5 grid gap-3 sm:grid-cols-2">{types.map(item => <li key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><input type="checkbox" checked={item.active} aria-label={`Aceitar ${item.name || "tipo de atendimento"}`} onChange={event => setTypes(current => current.map(value => value.id === item.id ? { ...value, active: event.target.checked } : value))} className="size-4 shrink-0 accent-blue-600" /><input required maxLength={80} aria-label={`Nome do tipo ${item.name}`} value={item.name} onChange={event => setTypes(current => current.map(value => value.id === item.id ? { ...value, name: event.target.value } : value))} className="min-w-0 flex-1 rounded-lg border border-transparent p-1 text-sm text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600" /><span className="text-xs text-slate-400">{item.active ? "Ativo" : "Inativo"}</span></li>)}</ul><div className="mt-4 flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">Novo tipo de atendimento<input value={newType} maxLength={80} onChange={event => setNewType(event.target.value)} placeholder="Ex.: Consulta de retorno" className={settingsField} /></label><button type="button" onClick={addType} className={secondaryButton}><Plus size={16} aria-hidden="true" />Adicionar tipo</button></div></section>
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><h3 className="font-bold">Regras operacionais</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Duração padrão da consulta (minutos)<input required type="number" name="duration" min={5} max={240} step={1} defaultValue={settings.defaultDuration} className={settingsField} /></label><label className="text-xs font-semibold text-slate-600">Antecedência para cancelamento (horas)<input required type="number" name="cancellation" min={0} max={168} step={1} defaultValue={settings.cancellationHours} className={settingsField} /></label><label className="text-xs font-semibold text-slate-600">Abertura da clínica<input required type="time" name="opening" defaultValue={settings.openingTime} className={settingsField} /></label><label className="text-xs font-semibold text-slate-600">Encerramento da clínica<input required type="time" name="closing" defaultValue={settings.closingTime} className={settingsField} /></label></div><p className="mt-4 text-xs leading-5 text-slate-500">Estes parâmetros são cadastrados na demonstração. Sua aplicação às reservas e ao cancelamento depende da integração com a API.</p></section>
    <p role="status" aria-live="polite" className={feedback.text ? `rounded-xl p-3 text-sm ${feedback.error ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"}` : "sr-only"}>{feedback.text}</p>
    <div className="flex justify-end"><button type="submit" className={primaryButton}><Save size={17} aria-hidden="true" />Salvar parâmetros</button></div>
  </form>;
}
