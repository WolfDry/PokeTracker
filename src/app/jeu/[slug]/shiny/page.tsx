import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { ChecklistEntry } from "@/components/capture-checklist";
import { HuntCard } from "@/components/hunt-counter";
import { PlusIcon } from "@/components/icons";
import { LivingDex } from "@/components/living-dex";
import { SectionHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { notice, secondaryButton, smallButton, textLink } from "@/components/ui";
import { getGame } from "@/lib/data/games";
import { getPokedexBySlug } from "@/lib/data/pokedex";
import { getGameHunts, getHunts, getNationalShinies, getShinyDex, type Hunt } from "@/lib/data/shiny";
import { requireUser } from "@/lib/session";
import { newHuntHref } from "@/lib/shiny";
import { DexChips, loadGameDex, loadGameRoute } from "../game-dex";

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

/** Shiny dex d'un jeu : ses shasses en cours, puis un Pokédex du jeu en chromatique, en mosaïque ou en boîtes. */
async function VersionShinyDex({ slug, searchParams }: { slug: string; searchParams: PageProps<"/jeu/[slug]/shiny">["searchParams"] }) {
  const user = await requireUser(`/jeu/${slug}/shiny`);
  const { version, pokedexes, current, title, entries, coverageNote } = await loadGameDex(slug, searchParams);
  const [hunts, { speciesIds, meta }, route] = await Promise.all([getGameHunts(user.id, version.id), getShinyDex(user.id, version.id), loadGameRoute(slug)]);

  return (
    <div className="space-y-10">
      <Hunts hunts={hunts} newHuntHref={newHuntHref(slug)} />
      <section className="space-y-5">
        <DexChips pokedexes={pokedexes} current={current} href={(dex) => `/jeu/${slug}/shiny?dex=${dex}`} />
        {/* `key` : changer de Pokédex repart d'une sélection et de boîtes neuves. `route` ne sert qu'à l'ordre des lieux du panneau. */}
        <LivingDex
          key={current.slug}
          versionId={version.id}
          title={title}
          entries={entries}
          captured={speciesIds}
          coverageNote={coverageNote}
          route={route}
          shiny={{ gameSlug: slug, meta }}
        />
      </section>
    </div>
  );
}

/** Shiny dex National : toutes les shasses en cours, et les espèces obtenues dans au moins un jeu. Lecture seule. */
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
      <Hunts hunts={hunts} newHuntHref={newHuntHref(slug)} showGame />
      <section className="space-y-5">
        <LivingDex
          versionId={null}
          title="Pokédex National"
          entries={entries}
          captured={speciesIds}
          caughtIn={caughtIn}
          route={[]}
          shiny={{ gameSlug: slug, meta: {} }}
          coverageNote="Le National cumule tes jeux : une espèce compte dès qu'elle est obtenue en shiny dans l'un d'eux. Coche tes shinies depuis le shiny dex de chaque jeu."
        />
      </section>
    </div>
  );
}

/** Shasses en cours, avec leur compteur ; au National, regroupées par jeu. */
function Hunts({ hunts, newHuntHref, showGame = false }: { hunts: Hunt[]; newHuntHref: string; showGame?: boolean }) {
  const groups = showGame ? groupByGame(hunts) : [{ version: null, hunts }];
  return (
    <section className="space-y-4">
      <SectionHeader
        title="Shasses en cours"
        aside={
          <Link href={newHuntHref} className={`${secondaryButton} ${smallButton}`}>
            <PlusIcon size={16} /> Nouvelle shasse
          </Link>
        }
      />
      {hunts.length === 0 ? (
        <p className={notice}>
          Aucune shasse en cours.{" "}
          <Link href={newHuntHref} className={textLink}>
            Lance une shasse
          </Link>{" "}
          ou choisis « Shasser » sur un Pokémon manquant ci-dessous.
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

/** Par jeu, le jeu de la shasse la plus récente en premier. */
function groupByGame(hunts: Hunt[]) {
  const byGame = new Map<number, { version: Hunt["version"]; hunts: Hunt[] }>();
  for (const hunt of hunts) {
    const group = byGame.get(hunt.version.id) ?? { version: hunt.version, hunts: [] };
    group.hunts.push(hunt);
    byGame.set(hunt.version.id, group);
  }
  return [...byGame.values()];
}
