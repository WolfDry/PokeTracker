import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CaptureChecklist, type ChecklistEntry } from "@/components/capture-checklist";
import { HuntCard } from "@/components/hunt-counter";
import { PlusIcon } from "@/components/icons";
import { SectionHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { notice, secondaryButton, smallButton, textLink } from "@/components/ui";
import { getGame } from "@/lib/data/games";
import { getPokedexBySlug } from "@/lib/data/pokedex";
import { getGameHunts, getHunts, getNationalShinies, getShinyDex, type Hunt } from "@/lib/data/shiny";
import { requireUser } from "@/lib/session";
import { DexChips, loadGameDex } from "../game-dex";

export async function generateMetadata({ params }: PageProps<"/jeu/[slug]/shiny">): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  return { title: game ? `Shiny dex — ${game.nameFr}` : "Jeu introuvable" };
}

export default async function Page({ params, searchParams }: PageProps<"/jeu/[slug]/shiny">) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) notFound();

  // Session et `?dex=` se lisent à la requête : derrière un <Suspense>.
  return (
    <Suspense fallback={<PageSkeleton />}>
      {game.kind === "national" ? <NationalShinyDex slug={slug} /> : <VersionShinyDex slug={slug} searchParams={searchParams} />}
    </Suspense>
  );
}

/** Shiny dex d'un jeu : ses chasses en cours, puis la checklist chromatique d'un Pokédex du jeu. */
async function VersionShinyDex({ slug, searchParams }: { slug: string; searchParams: PageProps<"/jeu/[slug]/shiny">["searchParams"] }) {
  const user = await requireUser(`/jeu/${slug}/shiny`);
  const { version, pokedexes, current, title, entries, coverageNote } = await loadGameDex(slug, searchParams);
  const [hunts, { speciesIds, meta }] = await Promise.all([getGameHunts(user.id, version.id), getShinyDex(user.id, version.id)]);

  return (
    <div className="space-y-10">
      <Hunts hunts={hunts} newHuntHref={`/shiny/nouvelle?jeu=${slug}`} />
      <section className="space-y-5">
        <DexChips pokedexes={pokedexes} current={current} href={(dex) => `/jeu/${slug}/shiny?dex=${dex}`} />
        <SectionHeader title={title} aside={`${entries.length} Pokémon`} />
        <CaptureChecklist versionId={version.id} entries={entries} captured={speciesIds} coverageNote={coverageNote} shiny={{ gameSlug: slug, meta }} />
      </section>
    </div>
  );
}

/** Shiny dex National : toutes les chasses en cours, et les espèces obtenues dans au moins un jeu. Lecture seule. */
async function NationalShinyDex({ slug }: { slug: string }) {
  const user = await requireUser(`/jeu/${slug}/shiny`);
  const [pokedex, hunts, { speciesIds, caughtIn }] = await Promise.all([
    getPokedexBySlug("national"),
    getHunts(user.id, "ACTIVE"),
    getNationalShinies(user.id),
  ]);
  if (!pokedex) notFound();

  const entries: ChecklistEntry[] = pokedex.entries.map((entry) => ({ ...entry, locations: [] }));

  return (
    <div className="space-y-10">
      <Hunts hunts={hunts} newHuntHref="/shiny/nouvelle" showGame />
      <section className="space-y-5">
        <SectionHeader title="Pokédex National" aside={`${entries.length} Pokémon`} />
        <CaptureChecklist
          versionId={null}
          entries={entries}
          captured={speciesIds}
          caughtIn={caughtIn}
          shiny={{ gameSlug: slug, meta: {} }}
          coverageNote="Le National cumule tes jeux : une espèce compte dès qu'elle est obtenue en shiny dans l'un d'eux. Coche tes shinies depuis le shiny dex de chaque jeu."
        />
      </section>
    </div>
  );
}

/** Chasses en cours, avec leur compteur ; au National, regroupées par jeu. */
function Hunts({ hunts, newHuntHref, showGame = false }: { hunts: Hunt[]; newHuntHref: string; showGame?: boolean }) {
  const groups = showGame ? groupByGame(hunts) : [{ version: null, hunts }];
  return (
    <section className="space-y-4">
      <SectionHeader
        title="Chasses en cours"
        aside={
          <Link href={newHuntHref} className={`${secondaryButton} ${smallButton}`}>
            <PlusIcon size={16} /> Nouvelle chasse
          </Link>
        }
      />
      {hunts.length === 0 ? (
        <p className={notice}>
          Aucune chasse en cours.{" "}
          <Link href={newHuntHref} className={textLink}>
            Lance une chasse
          </Link>{" "}
          ou choisis « Chasser » sur un Pokémon manquant ci-dessous.
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.version?.id ?? "jeu"} className="space-y-2">
              {group.version && <h3 className="t-caption">{group.version.nameFr}</h3>}
              <ul className="grid gap-3 md:grid-cols-2">
                {group.hunts.map((hunt) => (
                  <HuntCard key={hunt.id} hunt={hunt} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Par jeu, le jeu de la chasse la plus récente en premier. */
function groupByGame(hunts: Hunt[]) {
  const byGame = new Map<number, { version: Hunt["version"]; hunts: Hunt[] }>();
  for (const hunt of hunts) {
    const group = byGame.get(hunt.version.id) ?? { version: hunt.version, hunts: [] };
    group.hunts.push(hunt);
    byGame.set(hunt.version.id, group);
  }
  return [...byGame.values()];
}
