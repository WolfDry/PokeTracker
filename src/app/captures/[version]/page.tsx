import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { CaptureChecklist, type ChecklistEntry } from "@/components/capture-checklist";
import { MapIcon, PokedexIcon } from "@/components/icons";
import { PageHeader, SectionHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { chip, secondaryButton } from "@/components/ui";
import { getCapturedSpeciesIds } from "@/lib/data/captures";
import { getVersionSpeciesLocations, type SpeciesLocation } from "@/lib/data/encounters";
import { getVersionBySlug } from "@/lib/data/games";
import { getPokedexBySlug } from "@/lib/data/pokedex";
import { requireUser } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/captures/[version]">): Promise<Metadata> {
  const { version } = await params;
  const game = await getVersionBySlug(version);
  return { title: game ? `Mes captures — ${game.nameFr}` : "Jeu introuvable" };
}

export default async function Page({ params, searchParams }: PageProps<"/captures/[version]">) {
  const { version: slug } = await params;
  const version = await getVersionBySlug(slug);
  if (!version) notFound();

  // Même repli que le Pokédex du jeu : national pour Colosseum / XD.
  const pokedexes = version.pokedexes.length > 0 ? version.pokedexes : [{ id: 1, slug: "national", nameFr: "National", descriptionFr: null, entryCount: 0 }];

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ href: "/captures", label: "Mes captures" }, { label: version.nameFr }]} />
      <PageHeader
        eyebrow={version.generation.nameFr}
        title={version.nameFr}
        intro="Ce qu'il te manque dans ce jeu, et où le trouver."
        actions={
          <>
            <Link href={`/jeux/${version.slug}`} className={secondaryButton}>
              <PokedexIcon size={18} /> Pokédex du jeu
            </Link>
            {version.coverage?.status !== "NONE" && (
              <Link href={`/rencontres/${version.slug}`} className={secondaryButton}>
                <MapIcon size={18} /> Lieux de rencontre
              </Link>
            )}
          </>
        }
      />

      {/* Le Pokédex choisi vient de `?dex=`, lu à la requête comme la session. */}
      <Suspense fallback={<PageSkeleton />}>
        <Checklist versionId={version.id} versionSlug={version.slug} pokedexes={pokedexes} coverage={version.coverage} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

type ChecklistProps = {
  versionId: number;
  versionSlug: string;
  pokedexes: { id: number; slug: string; nameFr: string; entryCount: number }[];
  coverage: { status: "FULL" | "PARTIAL" | "NONE"; note: string | null } | null;
  searchParams: PageProps<"/captures/[version]">["searchParams"];
};

async function Checklist({ versionId, versionSlug, pokedexes, coverage, searchParams }: ChecklistProps) {
  const user = await requireUser(`/captures/${versionSlug}`);
  const { dex } = await searchParams;
  const current = (typeof dex === "string" && pokedexes.find((p) => p.slug === dex)) || pokedexes[0];

  const [pokedex, captured, locations] = await Promise.all([
    getPokedexBySlug(current.slug),
    getCapturedSpeciesIds(user.id, versionId),
    coverage?.status === "NONE" ? ({} as Record<number, SpeciesLocation[]>) : getVersionSpeciesLocations(versionId),
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
              <Link
                key={p.id}
                href={`/captures/${versionSlug}?dex=${p.slug}`}
                aria-current={active ? "page" : undefined}
                className={chip(active)}
              >
                {p.nameFr}
              </Link>
            );
          })}
        </nav>
      )}
      <SectionHeader title={`Pokédex ${pokedex.nameFr}`} aside={`${entries.length} Pokémon`} />
      <CaptureChecklist versionId={versionId} entries={entries} captured={captured} coverageNote={coverageNote} />
    </div>
  );
}
