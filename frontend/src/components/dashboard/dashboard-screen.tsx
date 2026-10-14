
import { Dashboard } from "@/components/dashboard/dashboard";


export function DashboardScreen({view}:{view:"overview"|"queue"|"patients"}) {
  return <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-8 lg:px-10">
    <a href="#main" className="sr-only focus:not-sr-only focus:rounded-lg focus:bg-white focus:p-3">Pular para o conteúdo</a>

    <Dashboard view={view} />
  </div>;
}
