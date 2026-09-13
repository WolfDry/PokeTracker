import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Shiny" };

export default function Page() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Shiny</h1>
      <Suspense fallback={<PageSkeleton />}>
        <Content />
      </Suspense>
    </div>
  );
}

// Page protégée : redirige vers la connexion (avec retour ici) si personne n'est connecté.
async function Content() {
  const user = await requireUser("/shiny");
  return (
    <p className="text-muted">
      Connecté en tant que <span className="text-foreground">{user.name}</span>. Bientôt : compteur de chasse et shiny attrapés (phase 7).
    </p>
  );
}
