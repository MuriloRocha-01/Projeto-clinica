"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { Plus, Search, UserRound } from "lucide-react";
import { useClinic } from "@/components/clinic-provider";
import { weekdays, type ProfessionalSettings } from "@/types/settings";
import { ActiveBadge, SettingsPagination, SettingsDialog, settingsField, primaryButton, secondaryButton } from "./settings-ui";

function ProfessionalForm({ initial, onSave, onCancel }: {
  initial: ProfessionalSettings | null; onSave: (item: ProfessionalSettings) => string | null; onCancel: () => void;
}) {
  const [days, setDays] = useState(initial?.weekdays ?? [1, 2, 3, 4, 5]);
  const [photo, setPhoto] = useState(initial?.photo ?? "");
  const [error, setError] = useState("");
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const specialty = String(data.get("specialty") ?? "").trim();
    const crm = String(data.get("crm") ?? "").trim();
    const start = String(data.get("start") ?? "");
    const end = String(data.get("end") ?? "");
    if (!name || !specialty || !crm) { setError("Preencha nome, especialidade e registro profissional."); return; }
    if (!days.length || !start || !end || start >= end) { setError("Selecione os dias e um horário de término posterior ao início."); return; }
    const result = onSave({ id: initial?.id ?? crypto.randomUUID(), name, specialty, crm, start, end, weekdays: days, photo, active: initial?.active ?? true });
    if (result) setError(result);
  }
  return <form onSubmit={submit} className="space-y-4">
    <p className="text-xs leading-5 text-slate-500">Cadastro demonstrativo. Dias e horários serão aplicados igualmente em cada dia selecionado.</p>
    <label className="block text-xs font-semibold text-slate-600">Nome completo<input autoFocus required maxLength={120} name="name" defaultValue={initial?.name} className={settingsField} /></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-semibold text-slate-600">Especialidade<input required maxLength={80} name="specialty" defaultValue={initial?.specialty} className={settingsField} /></label><label className="block text-xs font-semibold text-slate-600">CRM / Registro profissional<input required maxLength={40} name="crm" placeholder="123456 / SP" defaultValue={initial?.crm} className={settingsField} /></label></div>
    <fieldset><legend className="text-xs font-semibold text-slate-600">Dias de atendimento</legend><div className="mt-2 flex flex-wrap gap-2">{weekdays.map((day, index) => <label key={day} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${days.includes(index) ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}><input type="checkbox" checked={days.includes(index)} onChange={event => setDays(current => event.target.checked ? [...current, index].sort() : current.filter(value => value !== index))} className="accent-blue-600" />{day}</label>)}</div></fieldset>
    <div className="grid grid-cols-2 gap-4"><label className="block text-xs font-semibold text-slate-600">Início<input required type="time" name="start" defaultValue={initial?.start ?? "08:00"} className={settingsField} /></label><label className="block text-xs font-semibold text-slate-600">Término<input required type="time" name="end" defaultValue={initial?.end ?? "18:00"} className={settingsField} /></label></div>
    <label className="block text-xs font-semibold text-slate-600">Foto de perfil<input type="file" accept="image/png,image/jpeg,image/webp" className={settingsField} onChange={event => {
      const file = event.target.files?.[0]; if (!file) return;
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) { setError("Use uma imagem PNG, JPEG ou WebP de até 2 MB."); event.target.value = ""; return; }
      setLoadingPhoto(true); setError(""); const reader = new FileReader();
      reader.onload = () => { if (typeof reader.result === "string") setPhoto(reader.result); setLoadingPhoto(false); };
      reader.onerror = () => { setError("Não foi possível ler a foto."); setLoadingPhoto(false); };
      reader.readAsDataURL(file);
    }} /><span className="mt-1 block font-normal text-slate-400">Até 2 MB · A imagem fica somente nesta sessão.</span></label>
    {photo && <div className="flex items-center gap-3">{/* Foto local, sem envio a um servidor. */}<Image unoptimized width={64} height={64} src={photo} alt="Prévia da foto do profissional" className="size-16 rounded-xl object-cover" /><button type="button" onClick={() => setPhoto("")} className={secondaryButton}>Remover foto</button></div>}
    <p role="alert" className={error ? "rounded-xl bg-rose-50 p-3 text-sm text-rose-700" : "sr-only"}>{error}</p>
    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={onCancel} className={secondaryButton}>Cancelar</button><button type="submit" disabled={loadingPhoto} className={`${primaryButton} disabled:opacity-50`}>{loadingPhoto ? "Carregando foto…" : "Salvar profissional"}</button></div>
  </form>;
}

export function ProfessionalsSettings() {
  const { settings, setSettings } = useClinic();
  const dialog = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<ProfessionalSettings | null>(null);
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const filtered = settings.professionals.filter(item => `${item.name} ${item.specialty} ${item.crm}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")));
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, pages);
  function open(item: ProfessionalSettings | null) { setEditing(item); setVersion(value => value + 1); dialog.current?.showModal(); }
  function save(item: ProfessionalSettings): string | null {
    if (settings.professionals.some(value => value.id !== item.id && value.crm.toLocaleLowerCase() === item.crm.toLocaleLowerCase())) return "Já existe um profissional com esse registro.";
    setSettings(current => ({ ...current, professionals: current.professionals.some(value => value.id === item.id) ? current.professionals.map(value => value.id === item.id ? item : value) : [...current.professionals, item] }));
    setMessage(`${item.name}: cadastro salvo nesta sessão.`); dialog.current?.close(); return null;
  }
  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Sua equipe de cuidado</h2><p className="mt-1 text-sm text-slate-500">{settings.professionals.filter(item => item.active).length} profissionais ativos</p></div><button type="button" onClick={() => open(null)} className={primaryButton}><Plus size={17} aria-hidden="true" />Novo Profissional</button></div>
    <label className="relative block max-w-md"><span className="sr-only">Buscar profissional</span><Search size={17} aria-hidden="true" className="absolute left-3 top-5 text-slate-400" /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por nome, especialidade ou CRM" className={`${settingsField} pl-9`} /></label>
    <p role="status" className={message ? "rounded-xl bg-blue-50 p-3 text-sm text-blue-700" : "sr-only"}>{message}</p>
    <ul className="grid gap-4 xl:grid-cols-2">{filtered.slice((currentPage - 1) * 8, currentPage * 8).map(item => <li key={item.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-start gap-3">{item.photo ? <Image unoptimized width={48} height={48} src={item.photo} alt={`Foto de ${item.name}`} className="size-12 rounded-xl object-cover" /> : <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><UserRound size={23} aria-hidden="true" /></span>}<div className="min-w-0 flex-1"><h3 className="break-words font-bold">{item.name}</h3><p className="mt-1 text-sm text-slate-500">{item.specialty}</p><p className="mt-1 text-xs text-slate-400">CRM / Registro: {item.crm}</p></div><ActiveBadge active={item.active} /></div><p className="mt-5 text-sm text-slate-600">{item.weekdays.map(day => weekdays[day]).join(" · ")}</p><p className="mt-1 text-sm font-semibold text-blue-700">{item.start}–{item.end}</p><div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => open(item)} aria-label={`Editar ${item.name}`} className={secondaryButton}>Editar cadastro</button><button type="button" onClick={() => { setSettings(current => ({ ...current, professionals: current.professionals.map(value => value.id === item.id ? { ...value, active: !value.active } : value) })); setMessage(`${item.name}: ${item.active ? "desativado" : "reativado"} nesta sessão.`); }} aria-label={`${item.active ? "Desativar" : "Reativar"} ${item.name}`} className={secondaryButton}>{item.active ? "Desativar" : "Reativar"}</button></div></li>)}</ul>
    <SettingsPagination page={currentPage} pages={pages} onChange={setPage} />
    {!filtered.length && <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Nenhum profissional encontrado.</p>}
    <SettingsDialog dialogRef={dialog} title={editing ? "Editar profissional" : "Novo profissional"} onClose={() => setEditing(null)}><ProfessionalForm key={version} initial={editing} onSave={save} onCancel={() => dialog.current?.close()} /></SettingsDialog>
  </section>;
}
