import type { ReactNode } from "react";

/** Gabarit des pages connexion / inscription : carte centrée, titre et sous-titre. */
export function AuthPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted">{intro}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">{children}</div>
    </div>
  );
}

/** Même hauteur que les formulaires, le temps de lire la session. */
export function AuthFormSkeleton({ fields }: { fields: number }) {
  return (
    <div aria-hidden className="animate-pulse space-y-4">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-1">
          <div className="h-4 w-28 rounded bg-background" />
          <div className="h-10 rounded-md bg-background" />
        </div>
      ))}
      <div className="h-10 rounded-md bg-background" />
    </div>
  );
}
