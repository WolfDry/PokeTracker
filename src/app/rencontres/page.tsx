import type { Metadata } from "next";

export const metadata: Metadata = { title: "Rencontres" };

export default function Page() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Rencontres</h1>
      <p className="text-muted">Bientôt : les Pokémon disponibles par jeu et par lieu (phase 4).</p>
    </div>
  );
}
