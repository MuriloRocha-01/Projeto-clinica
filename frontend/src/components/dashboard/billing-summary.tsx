import type { Appointment } from "@/types/dashboard";
import { billingSummary, formatMoney } from "@/services/billing";

export function BillingSummary({ appointments }: { appointments: Appointment[] }) {
  const totals = billingSummary(appointments);
  return <section aria-label="Resumo financeiro do dia" className="rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="font-bold">Valores do dia</h2>
    <p className="mt-1 text-xs text-slate-500">Agendamentos da data selecionada.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <article className="rounded-xl bg-emerald-50 p-4"><h3 className="text-xs font-semibold text-emerald-800">Particular · previsto</h3><p className="mt-2 text-2xl font-extrabold text-emerald-900">{formatMoney(totals.privateExpected)}</p><p className="mt-2 text-xs text-emerald-800">Consultas concluídas: {formatMoney(totals.privateCompleted)}</p></article>
      <article className="rounded-xl bg-orange-50 p-4"><h3 className="text-xs font-semibold text-orange-800">Convênios · previsto</h3><p className="mt-2 text-2xl font-extrabold text-orange-900">{formatMoney(totals.insuranceExpected)}</p><p className="mt-2 text-xs text-orange-800">Concluído para faturar: {formatMoney(totals.insuranceCompleted)}</p></article>
    </div>
    <p className="mt-3 text-xs leading-5 text-slate-500">Valores de consultas, sem confirmação de pagamento. Convênios serão faturados por lote; não compõem o caixa recebido do dia.</p>
  </section>;
}

