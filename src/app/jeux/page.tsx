import type { Metadata } from "next";
import Link from "next/link";
import { CoverageBadge } from "@/components/coverage-badge";
import { PageHeader } from "@/components/page-header";
import { cardLink } from "@/components/ui";
import { getGenerationsWithGames } from "@/lib/data/games";

export const metadata: Metadata = { title: "Pokédex par jeu" };

export default async function GamesPage() {
  const generations = await getGenerationsWithGames();

  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Pokédex" title="Pokédex par jeu" intro="Choisis un jeu pour voir son Pokédex et les Pokémon disponibles." />

      {generations.map((generation) => (
        <section key={generation.id} className="space-y-4">
          <div className="flex items-baseline gap-3">
            <h2 className="t-h2">{generation.nameFr}</h2>
            {generation.regionNames.length > 0 && <p className="t-small text-ink-2">{generation.regionNames.join(", ")}</p>}
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {generation.versions.map((version) => (
              <li key={version.id}>
                <Link href={`/jeux/${version.slug}`} className={`${cardLink} flex items-center justify-between gap-3 px-4 py-3.5`}>
                  <span className="font-semibold">{version.nameFr}</span>
                  <CoverageBadge status={version.coverage} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
