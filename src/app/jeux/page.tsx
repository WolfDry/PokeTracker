import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pokédex par jeu" };

export default function Page() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Pokédex par jeu</h1>
      <p className="text-muted">Bientôt : la liste des jeux et leur Pokédex (phase 2).</p>
    </div>
  );
}
