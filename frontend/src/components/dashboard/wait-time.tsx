"use client";

import { Clock3 } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { waitLabel, waitMinutes, waitTone, type WaitTone } from "@/services/queue-wait";
import { useDemoClock } from "./use-demo-clock";

const tones: Record<WaitTone, BadgeTone> = { ok: "neutral", warn: "warning", late: "danger" };

/** Quanto tempo o paciente espera na recepção. Muda de cor com a demora: cinza, âmbar (15 min) e vermelho (30 min). */
export function WaitTime({ checkInAt, className = "" }: { checkInAt: string; className?: string }) {
  const now = useDemoClock();
  const minutes = waitMinutes(checkInAt, now);
  if (minutes === null) return null;
  const tone = waitTone(minutes);
  return (
    <span role="timer" className={`inline-block ${className}`.trim()}>
      <Badge tone={tones[tone]} className="gap-1.5 whitespace-nowrap">
        {tone === "late" ? <span aria-hidden="true" className="size-1.5 rounded-full bg-current motion-safe:animate-pulse" /> : <Clock3 size={12} aria-hidden="true" />}
        {waitLabel(minutes)}
        {tone === "late" && <span className="sr-only"> — espera longa</span>}
      </Badge>
    </span>
  );
}
