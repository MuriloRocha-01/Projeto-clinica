import type { ReactNode, RefObject } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { controlStyles } from "@/components/ui/field";

// Mantidos com os nomes antigos para as telas de configurações; a aparência vem dos componentes de src/components/ui.
export const settingsField = `mt-2 ${controlStyles}`;
export const primaryButton = buttonStyles({ variant: "primary" });
export const secondaryButton = buttonStyles({ variant: "secondary", size: "sm" });

export function ActiveBadge({ active }: { active: boolean }) {
  return <Badge tone={active ? "success" : "neutral"}>{active ? "Ativo" : "Inativo"}</Badge>;
}

export function SettingsPagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  if (pages <= 1) return null;
  return <nav aria-label="Paginação dos cadastros" className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted"><span>Página {page} de {pages}</span><div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} className={secondaryButton}>Anterior</button><button type="button" disabled={page === pages} onClick={() => onChange(page + 1)} className={secondaryButton}>Próxima</button></div></nav>;
}

export function SettingsDialog({ dialogRef, title, children, onClose }: {
  dialogRef: RefObject<HTMLDialogElement | null>; title: string; children: ReactNode; onClose: () => void;
}) {
  return <Dialog dialogRef={dialogRef} title={title} onClose={onClose} closeLabel="Fechar formulário">{children}</Dialog>;
}
