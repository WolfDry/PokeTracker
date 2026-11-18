import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { ChecklistEntry } from "@/components/capture-checklist";
import { LivingDex } from "@/components/living-dex";
import { PageSkeleton } from "@/components/page-skeleton";
import { getCapturedForms, getCapturedSpeciesIds, getNationalCaptures, getNationalFormCaptures } from "@/lib/data/captures";
import { getCapturableForms, getVersionFormOrders } from "@/lib/data/forms";
import { getGame } from "@/lib/data/games";
import { getPokedexBySlug } from "@/lib/data/pokedex";
import { type CapturableForm, formsInGame } from "@/lib/forms";
import { requireUser } from "@/lib/session";
import { DexChips, loadGameDex, loadGameRoute } from "../game-dex";

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

/** Living dex d'un jeu : un Pokédex du jeu à la fois, en mosaïque, en boîtes ou lieu par lieu, cochable. */
async function VersionDex({ slug, searchParams }: { slug: string; searchParams: PageProps<"/jeu/[slug]/captures">["searchParams"] }) {
  const user = await requireUser(`/jeu/${slug}/captures`);
  const { version, pokedexes, current, title, entries, coverageNote } = await loadGameDex(slug, searchParams);
  const [captured, route, allForms, orders, capturedForms] = await Promise.all([
    getCapturedSpeciesIds(user.id, version.id),
    loadGameRoute(slug),
    getCapturableForms(),
    getVersionFormOrders(),
    getCapturedForms(user.id, version.id),
  ]);
  // Formes des espèces de ce Pokédex déjà sorties dans le jeu (pas de Prismillon Blizzard avant X et Y).
  const bySpecies: Record<number, CapturableForm[]> = {};
  for (const entry of entries) {
    const forms = formsInGame(allForms[entry.species.id], orders[version.id]);
    if (forms.length > 0) bySpecies[entry.species.id] = forms;
  }

  // `key` : changer de Pokédex repart d'une sélection et de boîtes neuves (la page reste montée entre deux visites).
  return (
    <div className="space-y-5">
      <DexChips pokedexes={pokedexes} current={current} href={(dex) => `/jeu/${slug}/captures?dex=${dex}`} />
      <LivingDex
        key={current.slug}
        versionId={version.id}
        title={title}
        entries={entries}
        captured={captured}
        coverageNote={coverageNote}
        route={route}
        forms={{ bySpecies, captured: capturedForms }}
      />
    </div>
  );
}

/** Living dex National : toutes les espèces, attrapées dès qu'elles le sont dans un jeu. Lecture seule. */
async function NationalDex({ slug }: { slug: string }) {
  const user = await requireUser(`/jeu/${slug}/captures`);
  const [pokedex, { speciesIds, caughtIn }, allForms, capturedForms] = await Promise.all([
    getPokedexBySlug("national"),
    getNationalCaptures(user.id),
    getCapturableForms(),
    getNationalFormCaptures(user.id),
  ]);
  if (!pokedex) notFound();

  const entries: ChecklistEntry[] = pokedex.entries.map((entry) => ({ ...entry, locations: [] }));

  return (
    <LivingDex
      versionId={null}
      title="Pokédex National"
      entries={entries}
      captured={speciesIds}
      caughtIn={caughtIn}
      route={[]}
      forms={{ bySpecies: allForms, captured: capturedForms }}
      coverageNote="Le National cumule tes jeux : une espèce compte dès qu'elle est attrapée dans l'un d'eux. Coche tes captures depuis le living dex de chaque jeu."
    />
  );
}
