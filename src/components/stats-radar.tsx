import type { BaseStats } from "@/lib/data/species";

const AXES: { key: keyof BaseStats; label: string }[] = [
  { key: "hp", label: "PV" },
  { key: "attack", label: "Attaque" },
  { key: "defense", label: "Défense" },
  { key: "speed", label: "Vitesse" },
  { key: "specialDefense", label: "Déf. Spé." },
  { key: "specialAttack", label: "Atq. Spé." },
];

/** Total des six stats de base. */
export const statsTotal = (stats: BaseStats) => AXES.reduce((sum, axis) => sum + stats[axis.key], 0);

/** Plus haute stat de base d'une famille, pour que tous ses radars partagent la même échelle. */
export const statsMax = (all: BaseStats[]) => Math.max(160, ...all.flatMap((s) => AXES.map((axis) => s[axis.key])));

type Props = {
  stats: BaseStats;
  /** Valeur de l'anneau extérieur. */
  max: number;
  size?: number;
  className?: string;
};

/** Radar à six axes, encre sur grille fine : la seule figure de la fiche. */
export function StatsRadar({ stats, max, size = 260, className }: Props) {
  const c = size / 2;
  const r = size / 2 - 40;
  const point = (index: number, k: number) => {
    const angle = ((-90 + index * 60) * Math.PI) / 180;
    return [c + Math.cos(angle) * r * k, c + Math.sin(angle) * r * k] as const;
  };
  const ring = (k: number) => AXES.map((_, i) => point(i, k).map((v) => v.toFixed(1)).join(",")).join(" ");
  const data = AXES.map((axis, i) => point(i, Math.min(stats[axis.key] / max, 1)));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Statistiques de base : ${AXES.map((axis) => `${axis.label} ${stats[axis.key]}`).join(", ")}`}
      className={`overflow-visible ${className ?? ""}`}
    >
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <polygon key={k} points={ring(k)} fill="none" stroke="var(--line)" strokeWidth={1} />
      ))}
      {AXES.map((axis, i) => {
        const [x, y] = point(i, 1);
        return <line key={axis.key} x1={c} y1={c} x2={x.toFixed(1)} y2={y.toFixed(1)} stroke="var(--line)" strokeWidth={1} />;
      })}
      <polygon
        points={data.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}
        fill="color-mix(in oklch, var(--ink) 12%, transparent)"
        stroke="var(--ink)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {data.map(([x, y], i) => (
        <circle key={AXES[i].key} cx={x.toFixed(1)} cy={y.toFixed(1)} r={4} fill="var(--ink)" stroke="var(--surface)" strokeWidth={2} />
      ))}
      {AXES.map((axis, i) => {
        const [x, y] = point(i, 1.15);
        const anchor = Math.abs(x - c) < 2 ? "middle" : x > c ? "start" : "end";
        return (
          <text key={axis.key} x={x.toFixed(1)} y={(y + 4).toFixed(1)} textAnchor={anchor} className="fill-ink-2 text-[11px] font-semibold">
            {axis.label}
            <tspan className="fill-ink font-bold"> {stats[axis.key]}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
