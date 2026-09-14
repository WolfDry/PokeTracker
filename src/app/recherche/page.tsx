import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader, SectionHeader } from "@/components/page-header";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { SearchForm } from "@/components/search-form";
import { TypeBadge } from "@/components/type-badge";
import { cardLink, dexNumber, spriteBox } from "@/components/ui";
import { searchAll } from "@/lib/data/search";

export const metadata: Metadata = { title: "Recherche" };

export default function SearchPage({ searchParams }: PageProps<"/recherche">) {
  return (
    <div className="space-y-8">
      <PageHeader title="Recherche" />
      {/* searchParams est une donnée de requête : lu sous Suspense pour garder la coquille statique. */}
      <Suspense fallback={<SearchForm size="lg" />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchResults({ searchParams }: { searchParams: PageProps<"/recherche">["searchParams"] }) {
  const { q } = await searchParams;
  const rawQuery = (Array.isArray(q) ? q[0] : q) ?? "";
  const results = rawQuery ? await searchAll(rawQuery) : null;

  return (
    <>
      <SearchForm defaultValue={rawQuery} autoFocus={!rawQuery} size="lg" />

      {results === null ? (
        <p className="max-w-2xl t-small text-ink-2">
          Cherche un Pokémon par son nom français ou anglais ou son numéro, un jeu, ou un lieu (« Route 101 », « Grotte Granite »…). Les accents et
          la casse sont ignorés.
        </p>
      ) : results.species.total + results.versions.total + results.locations.total === 0 ? (
        <p className="text-ink-2">Aucun résultat pour « {rawQuery} ».</p>
      ) : (
        <div className="space-y-10">
          <ResultSection title="Pokémon" shown={results.species.results.length} total={results.species.total}>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.species.results.map((species) => (
                <li key={species.id}>
                  <Link href={`/pokemon/${species.id}`} className={`${cardLink} flex items-center gap-3 p-3`}>
                    <span className={`${spriteBox} size-14`}>
                      <PokemonSprite pokemonId={species.pokemonId} alt={species.nameFr} size={56} />
                    </span>
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="flex items-baseline gap-2">
                        <span className="t-small text-ink-3">{dexNumber(species.id, 4)}</span>
                        <span className="truncate font-semibold">{species.nameFr}</span>
                      </span>
                      <span className="flex flex-wrap gap-1">
                        {species.types.map((type) => (
                          <TypeBadge key={type.slug} type={type} />
                        ))}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </ResultSection>

          <ResultSection title="Jeux" shown={results.versions.results.length} total={results.versions.total}>
            <ul className="flex flex-wrap gap-2">
              {results.versions.results.map((version) => (
                <li key={version.id}>
                  <Link href={`/jeux/${version.slug}`} className={`${cardLink} inline-flex items-baseline gap-2 rounded-md px-3.5 py-2.5`}>
                    <span className="font-semibold">{version.nameFr}</span>
                    <span className="t-small text-ink-2">{version.generationNameFr}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </ResultSection>

          <ResultSection title="Lieux" shown={results.locations.results.length} total={results.locations.total}>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.locations.results.map((location) => (
                <li key={location.id}>
                  <Link href={`/lieux/${location.slug}`} className={`${cardLink} flex items-baseline justify-between gap-3 px-4 py-3.5`}>
                    <span className="min-w-0">
                      <span className="font-semibold">{location.nameFr}</span>
                      {location.regionNameFr && <span className="ml-2 t-small text-ink-2">{location.regionNameFr}</span>}
                    </span>
                    {!location.hasEncounters && <span className="shrink-0 t-small text-ink-3">sans rencontres</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </ResultSection>
        </div>
      )}
    </>
  );
}

function ResultSection({ title, shown, total, children }: { title: string; shown: number; total: number; children: React.ReactNode }) {
  if (total === 0) return null;
  return (
    <section className="space-y-4">
      <SectionHeader title={title} aside={total > shown ? `${shown} sur ${total}` : total} />
      {children}
    </section>
  );
}
