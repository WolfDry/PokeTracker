import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRightIcon } from "@/components/icons";
import { PageHeader, SectionHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { ProgressBar } from "@/components/progress-bar";
import { card, chip, notice, textLink } from "@/components/ui";
import { getUserGames } from "@/lib/data/captures";
import { isDlcVersion } from "@/lib/data/filters";
import { getGenerationsWithGames } from "@/lib/data/games";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Mes captures" };

export default function Page() {
  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Mes jeux" title="Mes captures" intro="Avancement de tes Pokédex, jeu par jeu." />
      <Suspense fallback={<PageSkeleton />}>
        <Games />
      </Suspense>
    </div>
  );
}

const dateFr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

async function Games() {
  const user = await requireUser("/captures");
  const [games, generations] = await Promise.all([getUserGames(user.id), getGenerationsWithGames()]);
  const started = new Set(games.map((g) => g.version.id));
  // Les extensions (Isolarmure…) sont suivies avec leur jeu de base, pas comme un jeu à part.
  const others = generations
    .map((g) => ({ ...g, versions: g.versions.filter((v) => !started.has(v.id) && !isDlcVersion(v.slug)) }))
    .filter((g) => g.versions.length > 0);

  return (
    <>
      {games.length === 0 ? (
        <p className={notice}>Tu n&apos;as encore coché aucun Pokémon. Choisis un jeu ci-dessous, puis coche tes captures depuis son Pokédex.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {games.map((game) => (
            <li key={game.version.id} className={`${card} space-y-4 p-5`}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="t-h2">
                  <Link href={`/captures/${game.version.slug}`} className="hover:underline">
                    {game.version.nameFr}
                  </Link>
                </h2>
                <span className="t-small text-ink-3">
                  {game.generationName}
                  {game.lastCaughtAt && ` · ${dateFr.format(game.lastCaughtAt)}`}
                </span>
              </div>
              {game.dexes.map((dex) => (
                <ProgressBar key={dex.id} caught={dex.caught} total={dex.total} label={game.dexes.length > 1 ? `Pokédex ${dex.nameFr}` : "Pokédex"} />
              ))}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 t-small">
                <Link href={`/captures/${game.version.slug}`} className="inline-flex items-center gap-1 font-semibold hover:underline">
                  Manquants et où les trouver <ArrowRightIcon size={14} />
                </Link>
                <Link href={`/jeux/${game.version.slug}`} className={`${textLink} text-ink-2`}>
                  Cocher dans le Pokédex
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {others.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title={games.length === 0 ? "Choisir un jeu" : "Commencer un autre jeu"} />
          <div className="space-y-3">
            {others.map((generation) => (
              <div key={generation.id} className="flex flex-wrap items-center gap-2">
                <span className="w-full t-caption sm:w-32">{generation.nameFr}</span>
                {generation.versions.map((version) => (
                  <Link key={version.id} href={`/captures/${version.slug}`} className={chip(false)}>
                    {version.nameFr}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
