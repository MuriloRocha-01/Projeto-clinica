/** Logotipo da clínica: cruz azul dentro de um contorno oval que termina em ponta de estetoscópio. Redesenhado em SVG a partir da imagem enviada. */
export function ClinicLogo({ size = 40, decorative = false, className = "" }: { size?: number; decorative?: boolean; className?: string }) {
  const blue = "#1a75bb";
  return (
    <svg
      viewBox="395 330 410 540"
      width={size * (410 / 540)}
      height={size}
      className={className}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": "Logotipo da Clínica Bem Viver" })}
      focusable="false"
    >
      <path d="M604 358 A195 252 0 1 0 795 610" fill="none" stroke={blue} strokeWidth="9" strokeLinecap="round" />
      <circle cx="622" cy="360" r="19" fill="#fff" stroke={blue} strokeWidth="9" />
      <rect x="552" y="388" width="132" height="358" rx="9" fill={blue} />
      <rect x="438" y="501" width="358" height="133" rx="9" fill={blue} />
    </svg>
  );
}
