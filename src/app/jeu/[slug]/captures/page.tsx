import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CaptureChecklist, type ChecklistEntry } from "@/components/capture-checklist";
import { SectionHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { getCapturedSpeciesIds, getNationalCaptures } from "@/lib/data/captures";
import { getGame } from "@/lib/data/games";
import { getPokedexBySlug } from "@/lib/data/pokedex";
import { requireUser } from "@/lib/session";
import { DexChips, loadGameDex } from "../game-dex";

export async function generateMetadata({ params }: PageProps<"/jeu/[slug]/captures">): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  return { title: game ? `Living dex — ${game.nameFr}` : "Jeu introuvable" };
}

export default async function Page({ params, searchParams }: PageProps<"/jeu/[slug]/captures">) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) notFound();

  // Session et `?dex=` se lisent à la requête : derrière un <Suspense>.
  return (
    <Suspense fallback={<PageSkeleton />}>
      {game.kind === "national" ? <NationalDex slug={slug} /> : <VersionDex slug={slug} searchParams={searchParams} />}
    </Suspense>
  );
}

/** Living dex d'un jeu : un Pokédex du jeu à la fois, cochable, avec où trouver chaque Pokémon. */
async function VersionDex({ slug, searchParams }: { slug: string; searchParams: PageProps<"/jeu/[slug]/captures">["searchParams"] }) {
  const user = await requireUser(`/jeu/${slug}/captures`);
  const { version, pokedexes, current, title, entries, coverageNote } = await loadGameDex(slug, searchParams);
  const captured = await getCapturedSpeciesIds(user.id, version.id);

  return (
    <div className="space-y-5">
      <DexChips pokedexes={pokedexes} current={current} href={(dex) => `/jeu/${slug}/captures?dex=${dex}`} />
      <SectionHeader title={title} aside={`${entries.length} Pokémon`} />
      <CaptureChecklist versionId={version.id} entries={entries} captured={captured} coverageNote={coverageNote} />
    </div>
  );
}

/** Living dex National : toutes les espèces, attrapées dès qu'elles le sont dans un jeu. Lecture seule. */
async function NationalDex({ slug }: { slug: string }) {
  const user = await requireUser(`/jeu/${slug}/captures`);
  const [pokedex, { speciesIds, caughtIn }] = await Promise.all([getPokedexBySlug("national"), getNationalCaptures(user.id)]);
  if (!pokedex) notFound();

  const entries: ChecklistEntry[] = pokedex.entries.map((entry) => ({ ...entry, locations: [] }));

  return (
    <div className="space-y-5">
      <SectionHeader title="Pokédex National" aside={`${entries.length} Pokémon`} />
      <CaptureChecklist
        versionId={null}
        entries={entries}
        captured={speciesIds}
        caughtIn={caughtIn}
        coverageNote="Le National cumule tes jeux : une espèce compte dès qu'elle est attrapée dans l'un d'eux. Coche tes captures depuis le living dex de chaque jeu."
      />
    </div>
  );
}
