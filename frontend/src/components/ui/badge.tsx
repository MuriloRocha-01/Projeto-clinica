import type { ReactNode } from "react";

// Todas as combinações de texto/fundo passam de 4,5:1 (AA)
const tones = {
  neutral: "bg-canvas text-ink-soft",
  info: "bg-brand-50 text-brand-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-rose-50 text-rose-700",
  accent: "bg-accent text-brand-800",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "neutral", className = "", children }: {
  tone?: BadgeTone; className?: string; children: ReactNode;
}) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`.trim()}>{children}</span>;
}
