import type { ReactNode } from "react";

// Ilustrações simples e coloridas (estilo "flat") dos avisos do painel. São decorativas: o texto ao lado já diz tudo.
export type Scene = "bem-vindo" | "prioridade" | "agua" | "maos" | "retorno" | "duvidas";

const skin = "#fcd9b6";

function Frame({ blob, children, className }: { blob: string; children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 400 260" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet" className={className}>
      <circle cx="200" cy="130" r="118" fill={blob} />
      {children}
    </svg>
  );
}

const sparkle = (x: number, y: number, size = 7, fill = "#fbbf24") => <circle key={`${x}-${y}`} cx={x} cy={y} r={size} fill={fill} />;

export function PanelIllustration({ scene, className }: { scene: Scene; className?: string }) {
  switch (scene) {
    case "bem-vindo":
      return (
        <Frame blob="#E3FAA5" className={className}>
          <path d="M200 208 C100 142 108 58 160 60 C186 61 197 78 200 92 C203 78 214 61 240 60 C292 58 300 142 200 208 Z" fill="#f43f5e" />
          <path d="M116 138 H166 L181 106 L203 170 L219 126 L229 138 H284" stroke="#fff" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <g transform="translate(305 62)"><circle r="32" fill="#244F28" /><path d="M-6 -18H6V-6H18V6H6V18H-6V6H-18V-6H-6Z" fill="#fff" /></g>
          {sparkle(92, 70)}{sparkle(110, 205, 5, "#9ECB3C")}{sparkle(335, 170, 6, "#9ECB3C")}{sparkle(75, 150, 5)}
        </Frame>
      );
    case "prioridade":
      return (
        <Frame blob="#ede9fe" className={className}>
          <rect x="35" y="208" width="330" height="14" rx="7" fill="#c4b5fd" />
          {/* idosa, com bengala */}
          <circle cx="82" cy="98" r="17" fill={skin} /><path d="M66 92 Q82 70 98 92 Q82 84 66 92Z" fill="#E4E0D8" />
          <rect x="62" y="118" width="40" height="84" rx="16" fill="#244F28" /><path d="M112 140 V204" stroke="#92400e" strokeWidth="6" strokeLinecap="round" /><path d="M112 140 q10 -2 10 8" stroke="#92400e" strokeWidth="6" fill="none" strokeLinecap="round" />
          {/* gestante */}
          <circle cx="168" cy="98" r="17" fill={skin} /><path d="M150 96 Q168 66 186 96 Q168 82 150 96Z" fill="#7c2d12" />
          <rect x="148" y="118" width="40" height="84" rx="16" fill="#e11d48" /><circle cx="186" cy="156" r="19" fill="#fb7185" />
          {/* pai com bebê no colo */}
          <circle cx="250" cy="98" r="17" fill={skin} /><path d="M233 94 Q250 72 267 94 Q250 86 233 94Z" fill="#1f2937" />
          <rect x="230" y="118" width="40" height="84" rx="16" fill="#059669" /><circle cx="276" cy="146" r="11" fill={skin} /><rect x="266" y="154" width="22" height="22" rx="9" fill="#fbbf24" />
          {/* cadeirante */}
          <circle cx="332" cy="102" r="17" fill={skin} /><path d="M316 98 Q332 76 348 98 Q332 90 316 98Z" fill="#92400e" />
          <rect x="316" y="122" width="32" height="48" rx="13" fill="#7c3aed" /><path d="M330 170 H362" stroke="#7c3aed" strokeWidth="9" strokeLinecap="round" />
          <circle cx="330" cy="182" r="26" fill="none" stroke="#4c1d95" strokeWidth="7" /><circle cx="330" cy="182" r="4" fill="#4c1d95" />
          {sparkle(60, 60, 6)}{sparkle(205, 52, 7, "#a78bfa")}{sparkle(370, 70, 5)}
        </Frame>
      );
    case "agua":
      return (
        <Frame blob="#cffafe" className={className}>
          <path d="M138 66 H262 L248 205 Q246 220 232 220 H168 Q154 220 152 205 Z" fill="#fff" stroke="#0ea5e9" strokeWidth="7" strokeLinejoin="round" />
          <path d="M146 112 Q173 98 200 112 T254 112 L248 205 Q246 214 232 214 H168 Q154 214 152 205 Z" fill="#38bdf8" />
          <path d="M160 126 L166 200" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity=".55" />
          <circle cx="205" cy="150" r="6" fill="#fff" opacity=".7" /><circle cx="226" cy="172" r="4" fill="#fff" opacity=".7" /><circle cx="196" cy="184" r="3.5" fill="#fff" opacity=".7" />
          <path d="M330 92 C330 92 306 124 306 140 a24 24 0 0 0 48 0 C354 124 330 92 330 92Z" fill="#0ea5e9" /><path d="M322 142 a10 10 0 0 0 8 10" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".7" />
          <path d="M72 128 C72 128 58 148 58 158 a14 14 0 0 0 28 0 C86 148 72 128 72 128Z" fill="#38bdf8" />
          {sparkle(95, 70, 6, "#fbbf24")}{sparkle(300, 60, 5, "#fbbf24")}{sparkle(345, 200, 6, "#38bdf8")}
        </Frame>
      );
    case "maos":
      return (
        <Frame blob="#d1fae5" className={className}>
          <rect x="150" y="128" width="104" height="92" rx="32" fill={skin} />
          <rect x="150" y="72" width="21" height="78" rx="10.5" fill={skin} /><rect x="176" y="52" width="21" height="98" rx="10.5" fill={skin} />
          <rect x="202" y="48" width="21" height="102" rx="10.5" fill={skin} /><rect x="228" y="64" width="21" height="86" rx="10.5" fill={skin} />
          <rect x="118" y="150" width="22" height="72" rx="11" fill={skin} transform="rotate(-48 129 186)" />
          {[[170, 160, 17], [208, 150, 21], [232, 184, 15], [186, 196, 13]].map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#fff" stroke="#a7f3d0" strokeWidth="3" />)}
          {[[96, 90, 20], [306, 100, 26], [330, 170, 15], [85, 190, 12], [290, 52, 11]].map(([x, y, r]) => (
            <g key={`${x}-${y}`}><circle cx={x} cy={y} r={r} fill="#fff" fillOpacity=".55" stroke="#34d399" strokeWidth="3" /><circle cx={x - r / 3} cy={y - r / 3} r={r / 5} fill="#fff" /></g>
          ))}
          {sparkle(260, 40, 5, "#fbbf24")}{sparkle(70, 130, 5, "#fbbf24")}
        </Frame>
      );
    case "retorno":
      return (
        <Frame blob="#fef3c7" className={className}>
          <rect x="108" y="56" width="184" height="164" rx="20" fill="#fff" stroke="#244F28" strokeWidth="6" />
          <path d="M108 100 V76 a20 20 0 0 1 20 -20 H272 a20 20 0 0 1 20 20 V100 Z" fill="#244F28" />
          <rect x="148" y="40" width="14" height="32" rx="7" fill="#142E17" /><rect x="238" y="40" width="14" height="32" rx="7" fill="#142E17" />
          {[0, 1, 2].flatMap(row => [0, 1, 2, 3].map(col => <circle key={`${row}-${col}`} cx={146 + col * 36} cy={132 + row * 30} r="8" fill={row === 1 && col === 2 ? "#f59e0b" : "#E4E0D8"} />))}
          <circle cx="282" cy="206" r="36" fill="#10b981" stroke="#fff" strokeWidth="6" /><path d="M264 206 L277 219 L302 191" stroke="#fff" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {sparkle(80, 80)}{sparkle(335, 90, 5, "#9ECB3C")}{sparkle(95, 200, 5, "#fb7185")}
        </Frame>
      );
    case "duvidas":
      return (
        <Frame blob="#ffe4e6" className={className}>
          <circle cx="170" cy="100" r="23" fill={skin} /><path d="M148 96 Q170 66 192 96 Q170 84 148 96Z" fill="#1f2937" />
          <rect x="138" y="124" width="64" height="70" rx="24" fill="#fff" stroke="#CBC5B8" strokeWidth="4" /><path d="M164 146H176V158H188V170H176V182H164V170H152V158H164Z" fill="#e11d48" />
          <rect x="70" y="176" width="260" height="46" rx="12" fill="#244F28" /><rect x="60" y="166" width="280" height="16" rx="8" fill="#142E17" />
          <path d="M240 38 H336 a22 22 0 0 1 22 22 V84 a22 22 0 0 1 -22 22 H292 L268 128 V106 H240 a22 22 0 0 1 -22 -22 V60 a22 22 0 0 1 22 -22Z" fill="#fff" stroke="#e11d48" strokeWidth="5" strokeLinejoin="round" />
          <text x="288" y="90" textAnchor="middle" fontSize="54" fontWeight="800" fill="#e11d48">?</text>
          {sparkle(90, 90)}{sparkle(370, 160, 5, "#9ECB3C")}{sparkle(100, 150, 5, "#9ECB3C")}
        </Frame>
      );
  }
}
