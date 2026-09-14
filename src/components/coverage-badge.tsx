import { StatusBadge } from "@/components/status-badge";
import type { CoverageStatus } from "@/generated/prisma/enums";

const LABELS: Record<CoverageStatus, { label: string; tone: "success" | "neutral" }> = {
  FULL: { label: "Rencontres", tone: "success" },
  PARTIAL: { label: "Rencontres partielles", tone: "neutral" },
  NONE: { label: "Sans rencontres", tone: "neutral" },
};

export function CoverageBadge({ status }: { status: CoverageStatus }) {
  const { label, tone } = LABELS[status];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}
