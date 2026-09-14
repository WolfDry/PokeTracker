import type { Metadata } from "next";
import Link from "next/link";
import { CoverageBadge } from "@/components/coverage-badge";
import { PageHeader } from "@/components/page-header";
import { cardLink } from "@/components/ui";
import { getGenerationsWithGames } from "@/lib/data/games";

export const metadata: Metadata = { title: "Rencontres" };

export default async function EncountersPage() {
  const generations = await getGenerationsWithGames();

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Rencontres"
        title="Où trouver un Pokémon"
        intro="Choisis un jeu, puis un lieu, pour voir les Pokémon qu'on y rencontre : méthode, niveaux, taux et conditions."
      />

      {generations.map((generation) => (
        <section key={generation.id} className="space-y-4">
          <div className="flex items-baseline gap-3">
            <h2 className="t-h2">{generation.nameFr}</h2>
            {generation.regionNames.length > 0 && <p className="t-small text-ink-2">{generation.regionNames.join(", ")}</p>}
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {generation.versions.map((version) => (
              <li key={version.id}>
                {version.coverage === "NONE" ? (
                  // Pas de données de rencontre : carte inactive plutôt qu'une page vide.
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-line px-4 py-3.5 text-ink-3"
                    title="PokeAPI ne fournit pas encore les lieux de rencontre de ce jeu."
                  >
                    <span className="font-semibold">{version.nameFr}</span>
                    <CoverageBadge status={version.coverage} />
                  </div>
                ) : (
                  <Link href={`/rencontres/${version.slug}`} className={`${cardLink} flex items-center justify-between gap-3 px-4 py-3.5`}>
                    <span className="font-semibold">{version.nameFr}</span>
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
