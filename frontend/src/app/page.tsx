
import { Dashboard } from "@/components/dashboard/dashboard";


export default function Home() {
  return <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-8 lg:px-10">
    <a href="#main" className="sr-only focus:not-sr-only focus:rounded-lg focus:bg-white focus:p-3">Pular para o conteúdo</a>

    <Dashboard />
    <footer className="mt-8 flex flex-wrap justify-between gap-2 text-xs text-slate-500"><span>© 2026 Cliniq · Cuidar começa com uma boa gestão.</span><span>Ambiente de demonstração · dados fictícios</span></footer>
  </div>;
}


