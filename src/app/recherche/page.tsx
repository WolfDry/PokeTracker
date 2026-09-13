import type { Metadata } from "next";

export const metadata: Metadata = { title: "Recherche" };

export default function Page() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Recherche</h1>
      <p className="text-muted">Bientôt : recherche de Pokémon, de jeux et de lieux (phase 3).</p>
    </div>
  );
}
