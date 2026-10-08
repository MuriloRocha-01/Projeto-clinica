import { Users, CalendarDays, Armchair, CircleCheck, ArrowUpRight } from "lucide-react";
import type { DashboardMetric } from "@/types/dashboard";
const icons = { patients: Users, appointments: CalendarDays, queue: Armchair, completed: CircleCheck };
export function MetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = icons[metric.icon];
  return <article className={`rounded-2xl p-5 shadow-sm ${metric.featured ? "bg-blue-600 text-white" : "border border-white bg-white"}`}><div className="flex items-center justify-between"><span className={`rounded-lg p-2 ${metric.featured ? "bg-white/15" : "bg-slate-50 text-slate-500"}`}><Icon size={19} aria-hidden="true" /></span><ArrowUpRight size={17} className={metric.featured ? "text-blue-200" : "text-slate-300"} aria-hidden="true" /></div><p className={`mt-5 text-sm ${metric.featured ? "text-blue-100" : "text-slate-500"}`}>{metric.label}</p><p className="mt-1 text-3xl font-extrabold tracking-tight">{String(metric.value).padStart(2, "0")}</p><p className={`mt-3 text-xs ${metric.featured ? "text-blue-100" : "text-slate-500"}`}>{metric.description}</p></article>;
}
