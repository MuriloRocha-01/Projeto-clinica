"use client";

import { Activity, LayoutDashboard, CalendarDays, Users, ChevronDown, ShieldCheck, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";


const navigationItems = [
  { label: "Visão geral", href: "/dashboard", icon: LayoutDashboard },
  { label: "Agenda", href: "/dashboard/agenda", icon: CalendarDays },
  { label: "Pacientes", href: "/dashboard/pacientes", icon: Users },
  { label: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
] as const;

export function Navbar() {
  const pathname = usePathname();
  return (
    <aside aria-label="Menu da clínica" className="relative flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64 lg:flex-nowrap lg:flex-col lg:items-stretch lg:justify-start lg:overflow-y-auto lg:rounded-none lg:border-y-0 lg:border-l-0 lg:p-6">
      <Link href="/dashboard" aria-label="Cliniq início" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-blue-600">
        <span className="rounded-xl bg-blue-600 p-2.5 text-white"><Activity size={22} aria-hidden="true" /></span>
        <span className="text-xl font-extrabold tracking-tight">cliniq<span className="text-blue-600">.</span></span>
      </Link>
      <nav aria-label="Navegação principal" className="order-3 flex w-full gap-1 overflow-x-auto text-sm font-semibold lg:order-none lg:mt-8 lg:flex-col lg:overflow-visible">
        {navigationItems.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} aria-current={(href === "/dashboard" ? pathname === href : pathname.startsWith(href)) ? "page" : undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${(href === "/dashboard" ? pathname === href : pathname.startsWith(href)) ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
            <Icon size={18} aria-hidden="true" />{label}
          </Link>
        ))}
      </nav>
      <div className="lg:mt-auto lg:border-t lg:border-slate-100 lg:pt-5">
        <p className="mb-4 hidden text-xs text-slate-400 lg:block">Clínica Bem Viver</p>
        <details className="relative">
          <summary className="flex list-none items-center gap-3 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-blue-600">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">AO</span>
            <span className="hidden min-w-0 sm:block"><span className="block text-sm font-bold">Dra. Ana Oliveira</span><span className="block text-xs text-slate-500">Perfil de demonstração</span></span>
            <ChevronDown size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 top-full z-40 mt-4 w-64 rounded-2xl border border-slate-100 bg-white p-5 shadow-lg lg:bottom-full lg:left-0 lg:right-auto lg:top-auto lg:mb-4 lg:mt-0 lg:w-full">
            <ShieldCheck className="mb-2 text-blue-600" size={20} aria-hidden="true" />
            <p className="text-sm font-bold">Perfil de demonstração</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Recepção e gestão da Clínica Bem Viver. Autenticação ainda não conectada.</p>
          </div>
        </details>
      </div>
    </aside>
  );
}
