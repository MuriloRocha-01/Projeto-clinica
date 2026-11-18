import Link from "next/link";
import { ArrowRight, ArrowUp, Sparkles } from "lucide-react";
import { ClinicLogo } from "@/components/clinic-logo";

export function Footer() {
  const linkStyle = "inline-flex items-center gap-2 rounded text-sm text-muted transition-colors hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-brand-600";
  return <footer className="mt-12 border-t border-line/80 bg-white" aria-label="Rodapé Cliniq">
    <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-10">
      <div className="grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.2fr] lg:gap-16 lg:py-12">
        <div>
          <Link href="/dashboard" aria-label="Cliniq — visão geral" className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-brand-600"><ClinicLogo decorative size={46} /><span className="text-2xl font-extrabold tracking-tight text-ink">cliniq<span className="text-brand-600">.</span></span></Link>
          <p className="mt-5 max-w-xs text-sm leading-6 text-muted">Mais organização para sua clínica.<br />Mais tempo para cuidar de pessoas.</p>
          <p className="mt-5 text-xs font-semibold tracking-wide text-muted">Cuidar começa com uma boa gestão.</p>
        </div>
        <nav aria-label="Navegação do rodapé">
          <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.15em] text-ink">Sua clínica</h2>
          <ul className="space-y-4">
            <li><Link href="/dashboard" className={linkStyle}>Visão geral</Link></li>
            <li><Link href="/dashboard/agenda" className={linkStyle}>Agenda e atendimentos</Link></li>
            <li><Link href="/dashboard/pacientes" className={linkStyle}>Pacientes e prontuários</Link></li>
          </ul>
        </nav>
        <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-brand-700"><Sparkles size={17} aria-hidden="true" /><h2 className="text-sm font-bold">Conheça seu espaço de cuidado</h2></div>
          <p className="mt-3 text-sm leading-6 text-muted">Acompanhe pacientes, organize consultas e encontre os prontuários em um só lugar.</p>
          <Link href="/dashboard/pacientes" className="mt-5 inline-flex items-center gap-2 rounded text-sm font-semibold text-brand-700 hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-brand-600">Explorar pacientes <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t border-line py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Cliniq. Todos os direitos reservados.</p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3"><span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-amber-400" aria-hidden="true" />Ambiente de demonstração · dados fictícios</span><a href="#top" className="inline-flex items-center gap-1.5 rounded font-semibold text-ink-soft hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-brand-600">Voltar ao topo <ArrowUp size={14} aria-hidden="true" /></a></div>
      </div>
    </div>
  </footer>;
}
