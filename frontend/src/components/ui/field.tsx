import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

/** Aparência de campos de texto e listas. Exportada para os poucos casos com marcação própria (ex.: campo com ícone). */
export const controlStyles =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-normal text-slate-800 " +
  "placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-brand-600 " +
  "disabled:bg-slate-50 disabled:text-slate-600";

/** Rótulo + controle + dica. O <label> envolve o controle, então leitores de tela já associam os dois. */
export function Field({ label, hint, className = "", children }: {
  label: string; hint?: string; className?: string; children: ReactNode;
}) {
  return (
    <label className={`block text-xs font-semibold text-slate-700 ${className}`.trim()}>
      {label}
      <span className="mt-1.5 block">{children}</span>
      {hint ? <span className="mt-1 block text-xs font-normal text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlStyles} ${className}`.trim()} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${controlStyles} ${className}`.trim()} {...props} />;
}
