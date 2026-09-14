/** Squelette générique affiché pendant le streaming d'une page dynamique. */
export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-8" aria-busy>
      <div className="space-y-3">
        <div className="h-4 w-32 rounded-sm bg-surface-2" />
        <div className="h-10 w-72 rounded-sm bg-surface-2" />
      </div>
      <div className="h-24 rounded-lg bg-surface-2" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="h-20 rounded-lg bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
