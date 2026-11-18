"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CornerDownLeft, LayoutDashboard, Search, Settings, Tv, User, Users, type LucideIcon } from "lucide-react";
import { useClinic } from "@/components/clinic-provider";

/** Qualquer parte da tela pode abrir a busca disparando este evento (o menu lateral usa isso). */
export const OPEN_PALETTE_EVENT = "cliniq:open-palette";

type Group = "Ir para" | "Pacientes";
interface Item { id: string; group: Group; label: string; hint: string; href: string; icon: LucideIcon; keywords: string }

const pages: Item[] = [
  { id: "p-visao", group: "Ir para", label: "Visão geral", hint: "Painel do dia", href: "/dashboard", icon: LayoutDashboard, keywords: "painel inicio dashboard" },
  { id: "p-agenda", group: "Ir para", label: "Agenda", hint: "Grade semanal e fila de atendimento", href: "/dashboard/agenda", icon: CalendarDays, keywords: "consultas horarios fila" },
  { id: "p-pacientes", group: "Ir para", label: "Pacientes", hint: "Cadastro e prontuários", href: "/dashboard/pacientes", icon: Users, keywords: "prontuario cadastro" },
  { id: "p-painel", group: "Ir para", label: "Painel de chamada", hint: "Tela para a TV da sala de espera", href: "/painel", icon: Tv, keywords: "tv sala de espera chamar senha fila" },
  { id: "p-config", group: "Ir para", label: "Configurações", hint: "Profissionais, usuários e clínica", href: "/dashboard/configuracoes", icon: Settings, keywords: "profissionais usuarios ajustes" },
];

/** minúsculas e sem acentos; cada caractere vira um só, então os índices continuam valendo no texto original */
const normalize = (text: string) => [...text].map(char => char.normalize("NFD").replace(/[̀-ͯ]/g, "")).join("").toLocaleLowerCase("pt-BR");

function Highlight({ text, query }: { text: string; query: string }) {
  const start = query ? normalize(text).indexOf(query) : -1;
  if (start < 0) return <>{text}</>;
  return <>{text.slice(0, start)}<mark className="rounded bg-brand-100 px-0.5 text-inherit">{text.slice(start, start + query.length)}</mark>{text.slice(start + query.length)}</>;
}

export function CommandPalette() {
  const router = useRouter();
  const { appointments } = useClinic();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const patients = useMemo<Item[]>(() => {
    const byId = new Map<number, Item>();
    for (const { patient } of appointments) {
      if (byId.has(patient.id)) continue;
      byId.set(patient.id, {
        id: `pac-${patient.id}`, group: "Pacientes", label: patient.name, hint: patient.phone, href: `/dashboard/pacientes/${patient.id}`, icon: User,
        keywords: `${patient.name} ${patient.phone} ${patient.email}`,
      });
    }
    return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [appointments]);

  const q = normalize(query.trim());
  const results = useMemo(() => {
    if (!q) return [...pages, ...patients.slice(0, 5)];
    return [...pages, ...patients]
      .filter(item => normalize(`${item.label} ${item.keywords}`).includes(q))
      .sort((a, b) => Number(normalize(b.label).startsWith(q)) - Number(normalize(a.label).startsWith(q)))
      .slice(0, 8);
  }, [q, patients]);
  const current = Math.min(active, Math.max(results.length - 1, 0));
  const optionId = (index: number) => `${listId}-${index}`;

  // Ctrl+K / ⌘K abre de qualquer tela; o menu lateral abre pelo evento
  useEffect(() => {
    const open = () => dialogRef.current?.showModal();
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); open(); }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, open);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener(OPEN_PALETTE_EVENT, open); };
  }, []);

  useEffect(() => { document.getElementById(optionId(current))?.scrollIntoView({ block: "nearest" }); });

  function run(item: Item | undefined) {
    if (!item) return;
    dialogRef.current?.close();
    router.push(item.href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((current + 1) % results.length); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((current - 1 + results.length) % results.length); }
    else if (event.key === "Enter") { event.preventDefault(); run(results[current]); }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Busca rápida"
      onClose={() => { setQuery(""); setActive(0); }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
      }}
      className="overview-dialog fixed inset-x-0 mx-auto mb-auto mt-[10vh] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl border border-line bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search size={18} className="shrink-0 text-muted" aria-hidden="true" />
        <input
          autoFocus
          value={query}
          onChange={event => { setQuery(event.target.value); setActive(0); }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results.length ? optionId(current) : undefined}
          aria-label="Buscar paciente ou ir para uma tela"
          placeholder="Buscar paciente, telefone ou tela…"
          className="min-h-14 w-full bg-transparent text-base outline-none placeholder:text-muted"
        />
        <kbd className="shrink-0 rounded-md border border-line px-1.5 py-0.5 text-xs font-semibold text-muted">Esc</kbd>
      </div>

      <ul id={listId} role="listbox" aria-label="Resultados" className="max-h-[50vh] overflow-y-auto p-2">
        {results.map((item, index) => {
          const Icon = item.icon;
          const isActive = index === current;
          return (
            <li key={item.id} role="presentation">
              {(index === 0 || results[index - 1].group !== item.group) && (
                <p aria-hidden="true" className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-muted">{item.group}</p>
              )}
              <div
                id={optionId(index)}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActive(index)}
                onClick={() => run(item)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${isActive ? "bg-brand-50 text-brand-800" : "text-ink-soft"}`}
              >
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${isActive ? "bg-white text-brand-700" : "bg-canvas text-muted"}`}><Icon size={17} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold"><Highlight text={item.label} query={q} /></span>
                  <span className="block truncate text-xs text-muted">{item.hint}</span>
                </span>
                {isActive && <CornerDownLeft size={15} className="shrink-0 text-brand-700" aria-hidden="true" />}
              </div>
            </li>
          );
        })}
      </ul>

      {!results.length && (
        <p role="status" className="px-6 py-10 text-center text-sm text-muted">Nenhum resultado para “{query}”. Tente o nome ou o telefone do paciente.</p>
      )}
      <p className="sr-only" role="status" aria-live="polite">{results.length} resultado(s)</p>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line bg-soft px-4 py-2.5 text-xs text-muted">
        <span><kbd className="font-semibold">↑↓</kbd> navegar</span>
        <span><kbd className="font-semibold">Enter</kbd> abrir</span>
        <span><kbd className="font-semibold">Esc</kbd> fechar</span>
      </footer>
    </dialog>
  );
}
