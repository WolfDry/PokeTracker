import type { CoverageStatus } from "@/generated/prisma/enums";

const STYLES: Record<CoverageStatus, { label: string; className: string }> = {
  FULL: { label: "Rencontres", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  PARTIAL: { label: "Rencontres partielles", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  NONE: { label: "Sans rencontres", className: "bg-zinc-500/15 text-muted" },
};

export function CoverageBadge({ status }: { status: CoverageStatus }) {
  const { label, className } = STYLES[status];
  return <span className={`inline-block rounded px-1.5 py-px text-[11px] font-medium ${className}`}>{label}</span>;
}
