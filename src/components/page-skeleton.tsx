/** Squelette générique affiché pendant le streaming d'une page dynamique. */
export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy>
      <div className="h-4 w-40 rounded bg-border" />
      <div className="h-8 w-72 rounded bg-border" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="h-[72px] rounded-lg bg-border" />
        ))}
      </div>
    </div>
  );
}
