/** Barre d'avancement d'un Pokédex : « 12 / 151 · 8 % », encre sur Surface 2. */
export function ProgressBar({ caught, total, label }: { caught: number; total: number; label?: string }) {
  const percent = total > 0 ? Math.round((caught / total) * 100) : 0;
  const complete = total > 0 && caught === total;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        {label && <span className="text-sm font-semibold">{label}</span>}
        <span className={`ml-auto text-sm ${complete ? "font-semibold text-success" : "text-ink-2"}`}>
          <b className="font-bold text-ink">{caught}</b> / {total} · {percent} %
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={caught} aria-valuemin={0} aria-valuemax={total}>
        <div className={`h-full rounded-full transition-[width] ${complete ? "bg-success" : "bg-ink"}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
