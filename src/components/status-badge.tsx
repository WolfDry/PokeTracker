import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "shiny" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "border-line text-ink-2",
  success: "border-success/40 text-success",
  shiny: "border-shiny/60 text-shiny",
  danger: "border-danger/40 text-danger",
};

/** Pastille d'état à bordure fine : « Attrapé », « Manquant », « Shiny », « Rencontres partielles »… */
export function StatusBadge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex h-6 items-center gap-1.5 rounded-full border bg-surface px-2.5 text-xs font-semibold whitespace-nowrap ${TONES[tone]}`}>
      {children}
    </span>
  );
}
