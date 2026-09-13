/** Barre d'avancement d'un Pokédex : « 12 / 151 · 8 % ». */
export function ProgressBar({ caught, total, label }: { caught: number; total: number; label?: string }) {
  const percent = total > 0 ? Math.round((caught / total) * 100) : 0;
  const complete = total > 0 && caught === total;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        {label && <span className="font-medium">{label}</span>}
        <span className={`ml-auto tabular-nums ${complete ? "text-emerald-600 dark:text-emerald-400" : "text-muted"}`}>
          {caught} / {total} · {percent} %{complete && " ✓"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={caught} aria-valuemin={0} aria-valuemax={total}>
        <div className={`h-full rounded-full transition-[width] ${complete ? "bg-emerald-500" : "bg-accent"}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
