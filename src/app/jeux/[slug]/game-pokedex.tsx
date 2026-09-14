import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { MapIcon } from "@/components/icons";
import { PageHeader, SectionHeader } from "@/components/page-header";
import { PokedexGrid } from "@/components/pokedex-grid";
import { card, chip, chipCount, notice, secondaryButton, textLink } from "@/components/ui";
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
    <div className="space-y-8">
      <Breadcrumb items={[{ href: "/jeux", label: "Pokédex" }, { label: version.nameFr }]} />

      <PageHeader
        eyebrow={version.generation.nameFr}
        title={`Pokémon ${version.nameFr}`}
        intro={
          <p className="t-small">
            Pokédex {pokedex.nameFr} · {pokedex.entries.length} Pokémon
            {version.siblings.length > 0 && (
              <>
                {" · "}Version jumelle :{" "}
                {version.siblings.map((sibling, index) => (
                  <span key={sibling.id}>
                    {index > 0 && ", "}
                    <Link href={`/jeux/${sibling.slug}`} className={textLink}>
                      {sibling.nameFr}
                    </Link>
                  </span>
                ))}
              </>
            )}
          </p>
        }
        actions={
          coverage?.status !== "NONE" && (
            <Link href={`/rencontres/${version.slug}`} className={secondaryButton}>
              <MapIcon size={18} /> Lieux de rencontre
            </Link>
          )
        }
      />

      {coverage?.status === "NONE" && <p className={`${notice} t-small`}>{coverage.note}</p>}
      {coverage?.status === "PARTIAL" && <p className={`${notice} t-small`}>{coverage.note}</p>}

      {pokedexes.length > 1 && (
        <nav className="flex flex-wrap gap-2" aria-label="Pokédex du jeu">
          {pokedexes.map((dex, index) => {
            const href = index === 0 ? `/jeux/${version.slug}` : `/jeux/${version.slug}/${dex.slug}`;
            const active = dex.slug === current.slug;
            return (
              <Link key={dex.id} href={href} aria-current={active ? "page" : undefined} className={chip(active)}>
                {dex.nameFr} <span className={chipCount(active)}>{dex.entryCount}</span>
              </Link>
            );
          })}
        </nav>
      )}

      <section className="space-y-4">
        {version.pokedexes.length === 0 && (
          <SectionHeader title="Pokédex national" aside="Ce jeu n'a pas de Pokédex régional." />
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
    <div aria-busy className="animate-pulse space-y-5">
      <div className={`${card} h-[118px]`} />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: Math.min(count, 30) }, (_, i) => (
          <li key={i} className={`${card} h-20`} />
        ))}
      </ul>
    </div>
  );
}
