import { X } from "lucide-react";
import type { ReactNode, RefObject } from "react";

export const settingsField = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600";
export const primaryButton = "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600";
export const secondaryButton = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600";

export function ActiveBadge({ active }: { active: boolean }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{active ? "Ativo" : "Inativo"}</span>;
}

export function SettingsPagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  if (pages <= 1) return null;
  return <nav aria-label="Paginação dos cadastros" className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"><span>Página {page} de {pages}</span><div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} className={`${secondaryButton} disabled:opacity-40`}>Anterior</button><button type="button" disabled={page === pages} onClick={() => onChange(page + 1)} className={`${secondaryButton} disabled:opacity-40`}>Próxima</button></div></nav>;
}

export function SettingsDialog({ dialogRef, title, children, onClose }: {
  dialogRef: RefObject<HTMLDialogElement | null>; title: string; children: ReactNode; onClose: () => void;
}) {
  return <dialog ref={dialogRef} onClose={onClose} aria-label={title} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-auto rounded-2xl border-0 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm">
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white p-5"><h2 className="text-lg font-bold">{title}</h2><button type="button" onClick={() => dialogRef.current?.close()} aria-label="Fechar formulário" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"><X size={20} aria-hidden="true" /></button></header>
    <div className="p-5">{children}</div>
  </dialog>;
}
