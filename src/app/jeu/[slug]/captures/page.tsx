import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CaptureChecklist, type ChecklistEntry } from "@/components/capture-checklist";
import { SectionHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { chip } from "@/components/ui";
import { getCapturedSpeciesIds, getNationalCaptures } from "@/lib/data/captures";
import { getVersionSpeciesLocations, type SpeciesLocation } from "@/lib/data/encounters";
import { getGame, getVersionBySlug } from "@/lib/data/games";
import { getPokedexBySlug } from "@/lib/data/pokedex";
import { requireUser } from "@/lib/session";

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
  const version = await getVersionBySlug(slug);
  if (!version) notFound();

  // Même repli que le Pokédex du jeu : national pour Colosseum / XD.
  const pokedexes = version.pokedexes.length > 0 ? version.pokedexes : [{ id: 1, slug: "national", nameFr: "National" }];
  const { dex } = await searchParams;
  const current = (typeof dex === "string" && pokedexes.find((p) => p.slug === dex)) || pokedexes[0];
  const coverage = version.coverage;

  const [pokedex, captured, locations] = await Promise.all([
    getPokedexBySlug(current.slug),
    getCapturedSpeciesIds(user.id, version.id),
    coverage?.status === "NONE" ? ({} as Record<number, SpeciesLocation[]>) : getVersionSpeciesLocations(version.id),
  ]);
  if (!pokedex) notFound();

  const entries: ChecklistEntry[] = pokedex.entries.map((entry) => ({ ...entry, locations: locations[entry.species.id] ?? [] }));
  const coverageNote = coverage?.status === "FULL" ? null : (coverage?.note ?? "Lieux de rencontre indisponibles pour ce jeu.");

  return (
    <div className="space-y-5">
      {pokedexes.length > 1 && (
        <nav className="flex flex-wrap gap-2" aria-label="Pokédex du jeu">
          {pokedexes.map((p) => {
            const active = p.slug === current.slug;
            return (
              <Link key={p.id} href={`/jeu/${slug}/captures?dex=${p.slug}`} aria-current={active ? "page" : undefined} className={chip(active)}>
                {p.nameFr}
              </Link>
            );
          })}
        </nav>
      )}
      <SectionHeader title={`Pokédex ${pokedex.nameFr}`} aside={`${entries.length} Pokémon`} />
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
