import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary: "border border-line bg-white text-ink-soft hover:bg-soft",
  ghost: "text-ink-soft hover:bg-canvas",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

// Alturas mínimas de 40/44/48 px: alvos de toque confortáveis
const sizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
};

/** Classes do botão, para usar também em links (<Link className={buttonStyles({...})}>). */
export function buttonStyles({ variant = "primary", size = "md", className = "" }: {
  variant?: ButtonVariant; size?: ButtonSize; className?: string;
} = {}) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}

export function Button({ variant, size, className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant; size?: ButtonSize;
}) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}
