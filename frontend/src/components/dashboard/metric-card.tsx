import { Users, CalendarDays, Armchair, CircleCheck, ArrowUpRight } from "lucide-react";
import type { DashboardMetric } from "@/types/dashboard";
const icons = { patients: Users, appointments: CalendarDays, queue: Armchair, completed: CircleCheck };
export function MetricCard({ metric, onClick }: { metric: DashboardMetric; onClick: () => void }) {
  const Icon = icons[metric.icon];
  return <button type="button" onClick={onClick} aria-haspopup="dialog" className={`overview-interactive group w-full text-left rounded-2xl p-5 shadow-sm ${metric.featured ? "bg-brand-600 text-white" : "border border-white bg-white"}`}><div className="flex items-center justify-between"><span className={`rounded-lg p-2 ${metric.featured ? "bg-white/15" : "bg-soft text-muted"}`}><Icon size={19} aria-hidden="true" /></span><ArrowUpRight size={17} className={`overview-arrow ${metric.featured ? "text-brand-50" : "text-muted"}`} aria-hidden="true" /></div><p className={`mt-5 text-sm ${metric.featured ? "text-white" : "text-muted"}`}>{metric.label}</p><p className="mt-1 text-3xl font-extrabold tracking-tight">{String(metric.value).padStart(2, "0")}</p><p className={`mt-3 text-xs ${metric.featured ? "text-white" : "text-muted"}`}>{metric.description}</p></button>;
}
