import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Mes captures" };

export default function Page() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Mes captures</h1>
      <Suspense fallback={<PageSkeleton />}>
        <Content />
      </Suspense>
    </div>
  );
}

// Page protégée : redirige vers la connexion (avec retour ici) si personne n'est connecté.
async function Content() {
  const user = await requireUser("/captures");
  return (
    <p className="text-muted">
      Connecté en tant que <span className="text-foreground">{user.name}</span>. Bientôt : suivi des captures par jeu (phase 6).
    </p>
  );
}
