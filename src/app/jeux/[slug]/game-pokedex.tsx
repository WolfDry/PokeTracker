import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PokedexGrid } from "@/components/pokedex-grid";
import { getCapturedSpeciesIds } from "@/lib/data/captures";
import { getVersionBySlug } from "@/lib/data/games";
import { getPokedexBySlug, type PokedexGridEntry } from "@/lib/data/pokedex";
import { getCurrentUser } from "@/lib/session";

type Props = {
  versionSlug: string;
  /** Pokédex demandé ; par défaut le premier du jeu. */
  dexSlug?: string;
};

/** Page Pokédex d'un jeu, partagée entre /jeux/[slug] et /jeux/[slug]/[dex]. */
export async function GamePokedex({ versionSlug, dexSlug }: Props) {
  const version = await getVersionBySlug(versionSlug);
  if (!version) notFound();

  // Colosseum / XD n'ont pas de Pokédex régional : on montre le national.
  const pokedexes = version.pokedexes.length > 0 ? version.pokedexes : [{ id: 1, slug: "national", nameFr: "National", descriptionFr: null, entryCount: 0 }];
  const current = dexSlug ? pokedexes.find((p) => p.slug === dexSlug) : pokedexes[0];
  if (!current) notFound();

  const pokedex = await getPokedexBySlug(current.slug);
  if (!pokedex) notFound();

  const coverage = version.coverage;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/jeux" className="hover:text-foreground">
          Pokédex par jeu
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{version.nameFr}</span>
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Pokémon {version.nameFr}</h1>
        <p className="text-sm text-muted">
          {version.generation.nameFr}
          {version.siblings.length > 0 && (
            <>
              {" · "}
              Version jumelle :{" "}
              {version.siblings.map((sibling, index) => (
                <span key={sibling.id}>
                  {index > 0 && ", "}
                  <Link href={`/jeux/${sibling.slug}`} className="underline hover:text-foreground">
                    {sibling.nameFr}
                  </Link>
                </span>
              ))}
            </>
          )}
        </p>
        {coverage?.status === "NONE" ? (
          <p className="rounded-md border border-border bg-card px-3 py-2 text-sm text-muted">{coverage.note}</p>
        ) : (
          <p className="text-sm">
            <Link href={`/rencontres/${version.slug}`} className="underline hover:text-accent">
              Voir les lieux de rencontre
            </Link>
            {coverage?.status === "PARTIAL" && <span className="text-muted"> — {coverage.note}</span>}
          </p>
        )}
      </header>

      {pokedexes.length > 1 && (
        <nav className="flex flex-wrap gap-2" aria-label="Pokédex du jeu">
          {pokedexes.map((dex, index) => {
            const href = index === 0 ? `/jeux/${version.slug}` : `/jeux/${version.slug}/${dex.slug}`;
            const active = dex.slug === current.slug;
            return (
              <Link
                key={dex.id}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full border px-3 py-1 text-sm ${
                  active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card hover:border-accent"
                }`}
              >
                {dex.nameFr} <span className="opacity-70">({dex.entryCount})</span>
              </Link>
            );
          })}
        </nav>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">
          Pokédex {pokedex.nameFr} <span className="text-sm font-normal text-muted">{pokedex.entries.length} Pokémon</span>
        </h2>
        {version.pokedexes.length === 0 && (
          <p className="text-sm text-muted">Ce jeu n&apos;a pas de Pokédex régional : Pokédex national affiché.</p>
        )}
        {/* Les captures dépendent de la session : la grille est streamée, le reste de la page reste statique. */}
        <Suspense fallback={<GridSkeleton count={pokedex.entries.length} />}>
          <GridWithCaptures versionId={version.id} entries={pokedex.entries} loginNext={dexSlug ? `/jeux/${version.slug}/${dexSlug}` : `/jeux/${version.slug}`} />
        </Suspense>
      </section>
    </div>
  );
}

async function GridWithCaptures({ versionId, entries, loginNext }: { versionId: number; entries: PokedexGridEntry[]; loginNext: string }) {
  const user = await getCurrentUser();
  const captured = user ? await getCapturedSpeciesIds(user.id, versionId) : null;
  return <PokedexGrid entries={entries} versionId={versionId} captured={captured} loginNext={loginNext} />;
}

function GridSkeleton({ count }: { count: number }) {
  return (
    <ul aria-busy className="grid animate-pulse grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="h-[74px] rounded-lg border border-border bg-card" />
      ))}
    </ul>
  );
}
