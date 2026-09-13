import type { Metadata } from "next";
import Link from "next/link";
import { CoverageBadge } from "@/components/coverage-badge";
import { getGenerationsWithGames } from "@/lib/data/games";

export const metadata: Metadata = { title: "Rencontres" };

export default async function EncountersPage() {
  const generations = await getGenerationsWithGames();

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Rencontres</h1>
        <p className="text-muted">
          Choisis un jeu, puis un lieu, pour voir les Pokémon qu&apos;on y rencontre : méthode, niveaux, taux et conditions.
        </p>
      </header>

      {generations.map((generation) => (
        <section key={generation.id} className="space-y-3">
          <h2 className="flex items-baseline gap-2 text-lg font-medium">
            {generation.nameFr}
            {generation.regionNames.length > 0 && (
              <span className="text-sm font-normal text-muted">{generation.regionNames.join(", ")}</span>
            )}
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {generation.versions.map((version) => (
              <li key={version.id}>
                {version.coverage === "NONE" ? (
                  // Pas de données de rencontre : carte inactive plutôt qu'une page vide.
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-3 text-muted"
                    title="PokeAPI ne fournit pas encore les lieux de rencontre de ce jeu."
                  >
                    <span className="font-medium">{version.nameFr}</span>
                    <CoverageBadge status={version.coverage} />
                  </div>
                ) : (
                  <Link
                    href={`/rencontres/${version.slug}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-accent"
                  >
                    <span className="font-medium">{version.nameFr}</span>
                    <CoverageBadge status={version.coverage} />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
