import type { ReactNode } from "react";

// Todas as combinações de texto/fundo passam de 4,5:1 (AA)
const tones = {
  neutral: "bg-slate-100 text-slate-700",
  info: "bg-brand-50 text-brand-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-rose-50 text-rose-700",
  accent: "bg-violet-50 text-violet-700",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "neutral", className = "", children }: {
  tone?: BadgeTone; className?: string; children: ReactNode;
}) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`.trim()}>{children}</span>;
}
