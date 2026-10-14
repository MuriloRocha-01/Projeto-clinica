"use client";

import { useRef, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useClinic } from "@/components/clinic-provider";
import { roleLabels, type ClinicUser, type UserRole } from "@/types/settings";
import { ActiveBadge, SettingsPagination, SettingsDialog, settingsField, primaryButton, secondaryButton } from "./settings-ui";

function UserForm({ initial, onSave, onCancel }: { initial: ClinicUser | null; onSave: (user: ClinicUser) => string | null; onCancel: () => void }) {
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const role = String(data.get("role") ?? "");
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Informe nome e e-mail válidos."); return; }
    if (role !== "admin" && role !== "reception" && role !== "doctor") { setError("Selecione um nível de permissão válido."); return; }
    const result = onSave({ id: initial?.id ?? crypto.randomUUID(), name, email, role, active: initial?.active ?? true });
    if (result) setError(result);
  }
  return <form onSubmit={submit} className="space-y-4"><p className="text-xs leading-5 text-slate-500">Este cadastro simula usuários. Nenhum convite é enviado e nenhuma conta real é criada.</p><label className="block text-xs font-semibold text-slate-600">Nome<input autoFocus required name="name" maxLength={120} defaultValue={initial?.name} className={settingsField} /></label><label className="block text-xs font-semibold text-slate-600">E-mail<input required type="email" name="email" maxLength={254} defaultValue={initial?.email} className={settingsField} /></label><label className="block text-xs font-semibold text-slate-600">Nível de permissão<select name="role" defaultValue={initial?.role ?? "reception"} className={settingsField}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><p role="alert" className={error ? "rounded-xl bg-rose-50 p-3 text-sm text-rose-700" : "sr-only"}>{error}</p><div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={onCancel} className={secondaryButton}>Cancelar</button><button type="submit" className={primaryButton}>Salvar usuário</button></div></form>;
}

export function UsersSettings() {
  const { settings, setSettings } = useClinic();
  const dialog = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<ClinicUser | null>(null);
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<UserRole | "all">("all");
  const [message, setMessage] = useState("");
  const filtered = settings.users.filter(user => (role === "all" || user.role === role) && `${user.name} ${user.email}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")));
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, pages);
  function open(user: ClinicUser | null) { setEditing(user); setVersion(value => value + 1); dialog.current?.showModal(); }
  function save(user: ClinicUser): string | null {
    if (settings.users.some(value => value.id !== user.id && value.email === user.email)) return "Este e-mail já está cadastrado.";
    if (editing?.active && editing.role === "admin" && user.role !== "admin" && !settings.users.some(value => value.id !== user.id && value.active && value.role === "admin")) return "Mantenha pelo menos um administrador ativo.";
    setSettings(current => ({ ...current, users: current.users.some(value => value.id === user.id) ? current.users.map(value => value.id === user.id ? user : value) : [...current.users, user] }));
    setMessage(`${user.name}: cadastro salvo nesta sessão.`); dialog.current?.close(); return null;
  }
  function toggle(user: ClinicUser) {
    if (user.active && user.role === "admin" && !settings.users.some(value => value.id !== user.id && value.active && value.role === "admin")) { setMessage("Mantenha pelo menos um administrador ativo."); return; }
    setSettings(current => ({ ...current, users: current.users.map(value => value.id === user.id ? { ...value, active: !value.active } : value) }));
    setMessage(`${user.name}: acesso ${user.active ? "revogado" : "reativado"} na demonstração.`);
  }
  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Usuários e acessos</h2><p className="mt-1 text-sm text-slate-500">Organize os perfis da equipe da clínica.</p></div><button type="button" onClick={() => open(null)} className={primaryButton}><Plus size={17} aria-hidden="true" />Novo Usuário</button></div>
    <div className="grid max-w-2xl gap-3 sm:grid-cols-[1.5fr_1fr]"><label><span className="sr-only">Buscar usuário por nome ou e-mail</span><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar nome ou e-mail" className={settingsField} /></label><label><span className="sr-only">Filtrar nível de permissão</span><select value={role} onChange={event => { setRole(event.target.value as UserRole | "all"); setPage(1); }} className={settingsField}><option value="all">Todos os perfis</option>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    <p role="status" className={message ? "rounded-xl bg-blue-50 p-3 text-sm text-blue-700" : "sr-only"}>{message}</p>
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm"><table className="w-full min-w-[660px] text-left text-sm"><caption className="sr-only">Usuários da clínica e níveis de permissão</caption><thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500"><tr>{["Usuário", "Permissão", "Status", "Ações"].map(label => <th key={label} scope="col" className="px-5 py-4 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.slice((currentPage - 1) * 8, currentPage * 8).map(user => <tr key={user.id}><td className="px-5 py-4"><p className="font-semibold text-slate-800">{user.name}</p><p className="mt-1 text-xs text-slate-500">{user.email}</p></td><td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{roleLabels[user.role]}</span></td><td className="px-5 py-4"><ActiveBadge active={user.active} /></td><td className="px-5 py-4"><div className="flex gap-2"><button type="button" onClick={() => open(user)} aria-label={`Editar ${user.name}`} className={secondaryButton}>Editar</button><button type="button" onClick={() => toggle(user)} aria-label={`${user.active ? "Revogar acesso de" : "Reativar acesso de"} ${user.name}`} className={secondaryButton}>{user.active ? "Revogar acesso" : "Reativar"}</button></div></td></tr>)}</tbody></table>{!filtered.length && <p className="p-10 text-center text-sm text-slate-500">Nenhum usuário encontrado.</p>}</div>
    <SettingsPagination page={currentPage} pages={pages} onChange={setPage} />
    <div className="grid gap-3 sm:grid-cols-3">{[{ role: "admin", description: "Gerencia configurações, equipe e operação." }, { role: "reception", description: "Organiza agenda, cadastros e recepção." }, { role: "doctor", description: "Consulta agenda e prontuários clínicos." }].map(item => <article key={item.role} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"><h3 className="text-sm font-bold">{roleLabels[item.role as UserRole]}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{item.description}</p></article>)}</div>
    <p className="text-xs text-slate-500">Perfis ilustrativos. A autorização real precisa ser aplicada pelo backend.</p>
    <SettingsDialog dialogRef={dialog} title={editing ? "Editar usuário" : "Novo usuário"} onClose={() => setEditing(null)}><UserForm key={version} initial={editing} onSave={save} onCancel={() => dialog.current?.close()} /></SettingsDialog>
  </section>;
}
