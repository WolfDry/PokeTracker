import type { ReactNode } from "react";
import { card } from "@/components/ui";

/** Gabarit des pages connexion / inscription : carte centrée, titre et sous-titre. */
export function AuthPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md space-y-8">
      <div className="space-y-2">
        <h1 className="t-display">{title}</h1>
        <p className="text-ink-2">{intro}</p>
      </div>
      <div className={`${card} p-6 sm:p-8`}>{children}</div>
    </div>
  );
}

/** Même hauteur que les formulaires, le temps de lire la session. */
export function AuthFormSkeleton({ fields }: { fields: number }) {
  return (
    <div aria-hidden className="animate-pulse space-y-5">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-4 w-28 rounded-sm bg-surface-2" />
          <div className="h-10 rounded-md bg-surface-2" />
        </div>
      ))}
      <div className="h-12 rounded-md bg-surface-2" />
    </div>
  );
}
