import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mes captures" };

export default function Page() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Mes captures</h1>
      <p className="text-muted">Bientôt : suivi des captures par jeu (phase 6).</p>
    </div>
  );
}
