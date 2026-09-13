import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { SearchForm } from "@/components/search-form";
import { TypeBadge } from "@/components/type-badge";
import { searchAll } from "@/lib/data/search";

export const metadata: Metadata = { title: "Recherche" };

export default function SearchPage({ searchParams }: PageProps<"/recherche">) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Recherche</h1>
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
        <p className="text-sm text-muted">
          Cherche un Pokémon par son nom français ou anglais ou son numéro, un jeu, ou un lieu (« Route 101 », « Grotte Granite »…).
          Les accents et la casse sont ignorés.
        </p>
      ) : results.species.total + results.versions.total + results.locations.total === 0 ? (
        <p className="text-muted">Aucun résultat pour « {rawQuery} ».</p>
      ) : (
        <div className="space-y-8">
          <ResultSection title="Pokémon" shown={results.species.results.length} total={results.species.total}>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {results.species.results.map((species) => (
                <li key={species.id}>
                  <Link
                    href={`/pokemon/${species.id}`}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 transition-colors hover:border-accent"
                  >
                    <PokemonSprite pokemonId={species.pokemonId} alt={species.nameFr} size={48} className="shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-muted">N° {String(species.id).padStart(4, "0")}</div>
                      <div className="truncate font-medium">{species.nameFr}</div>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {species.types.map((type) => (
                          <TypeBadge key={type.slug} type={type} />
                        ))}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </ResultSection>

          <ResultSection title="Jeux" shown={results.versions.results.length} total={results.versions.total}>
            <ul className="flex flex-wrap gap-2">
              {results.versions.results.map((version) => (
                <li key={version.id}>
                  <Link
                    href={`/jeux/${version.slug}`}
                    className="inline-flex items-baseline gap-2 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:border-accent"
                  >
                    <span className="font-medium">{version.nameFr}</span>
                    <span className="text-xs text-muted">{version.generationNameFr}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </ResultSection>

          <ResultSection title="Lieux" shown={results.locations.results.length} total={results.locations.total}>
            <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {results.locations.results.map((location) => (
                <li key={location.id}>
                  <Link
                    href={`/lieux/${location.slug}`}
                    className="flex items-baseline justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:border-accent"
                  >
                    <span>
                      <span className="font-medium">{location.nameFr}</span>
                      {location.regionNameFr && <span className="ml-2 text-xs text-muted">{location.regionNameFr}</span>}
                    </span>
                    {!location.hasEncounters && <span className="text-xs text-muted">sans rencontres</span>}
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
    <section className="space-y-3">
      <h2 className="text-lg font-medium">
        {title} <span className="text-sm font-normal text-muted">{total > shown ? `${shown} sur ${total}` : total}</span>
      </h2>
      {children}
    </section>
  );
}
