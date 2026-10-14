"use client";

import { useState } from "react";
import { Settings, Stethoscope, Users, SlidersHorizontal } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { ProfessionalsSettings } from "./professionals-settings";
import { UsersSettings } from "./users-settings";
import { GeneralSettings } from "./general-settings";

const tabs = [
  { id: "professionals", label: "Profissionais", icon: Stethoscope },
  { id: "users", label: "Usuários", icon: Users },
  { id: "general", label: "Parâmetros Gerais", icon: SlidersHorizontal },
] as const;
type SettingsTab = typeof tabs[number]["id"];

export function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("professionals");
  return <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-8 lg:px-10">
    <a href="#settings-main" className="sr-only focus:not-sr-only focus:rounded-lg focus:bg-white focus:p-3">Pular para configurações</a>
    <Navbar />
    <main id="settings-main" className="mt-8 lg:mt-3">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600"><Settings size={15} aria-hidden="true" />Administração da clínica</p><h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Configurações do Sistema</h1><p className="mt-2 text-sm text-slate-500">Equipe, acessos e parâmetros em um só lugar.</p></div><span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">Demonstração interativa</span></header>
      <p className="mb-6 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 text-xs leading-5 text-slate-500 shadow-sm">Dados fictícios. Alterações ficam nesta sessão e são descartadas ao recarregar. Autenticação, permissões reais e gravação no banco ainda não estão conectadas.</p>
      <div role="tablist" aria-label="Seções de configurações" className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
        {tabs.map((tab, index) => <button key={tab.id} id={`settings-tab-${tab.id}`} role="tab" type="button" aria-selected={activeTab === tab.id} aria-controls={`settings-panel-${tab.id}`} tabIndex={activeTab === tab.id ? 0 : -1} onClick={() => setActiveTab(tab.id)} onKeyDown={event => {
          let target: number;
          if (event.key === "ArrowRight") target = (index + 1) % tabs.length;
          else if (event.key === "ArrowLeft") target = (index + tabs.length - 1) % tabs.length;
          else if (event.key === "Home") target = 0;
          else if (event.key === "End") target = tabs.length - 1;
          else return;
          event.preventDefault(); setActiveTab(tabs[target].id); document.getElementById(`settings-tab-${tabs[target].id}`)?.focus();
        }} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-blue-600 ${activeTab === tab.id ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"}`}><tab.icon size={18} aria-hidden="true" />{tab.label}</button>)}
      </div>
      <section role="tabpanel" id="settings-panel-professionals" aria-labelledby="settings-tab-professionals" hidden={activeTab !== "professionals"}><ProfessionalsSettings /></section>
      <section role="tabpanel" id="settings-panel-users" aria-labelledby="settings-tab-users" hidden={activeTab !== "users"}><UsersSettings /></section>
      <section role="tabpanel" id="settings-panel-general" aria-labelledby="settings-tab-general" hidden={activeTab !== "general"}><GeneralSettings /></section>
    </main>
  </div>;
}
