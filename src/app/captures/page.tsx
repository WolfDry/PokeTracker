import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { ProgressBar } from "@/components/progress-bar";
import { getUserGames } from "@/lib/data/captures";
import { isDlcVersion } from "@/lib/data/filters";
import { getGenerationsWithGames } from "@/lib/data/games";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Mes captures" };

export default function Page() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Mes captures</h1>
        <p className="text-muted">Avancement de tes Pokédex, jeu par jeu.</p>
      </header>
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
        <p className="rounded-lg border border-border bg-card p-4 text-muted">
          Tu n&apos;as encore coché aucun Pokémon. Choisis un jeu ci-dessous, puis coche tes captures depuis son Pokédex.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {games.map((game) => (
            <li key={game.version.id} className="space-y-3 rounded-lg border border-border bg-card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-medium">
                  <Link href={`/captures/${game.version.slug}`} className="hover:text-accent">
                    {game.version.nameFr}
                  </Link>
                </h2>
                <span className="text-xs text-muted">
                  {game.generationName}
                  {game.lastCaughtAt && ` · ${dateFr.format(game.lastCaughtAt)}`}
                </span>
              </div>
              {game.dexes.map((dex) => (
                <ProgressBar key={dex.id} caught={dex.caught} total={dex.total} label={game.dexes.length > 1 ? `Pokédex ${dex.nameFr}` : "Pokédex"} />
              ))}
              <div className="flex flex-wrap gap-3 text-sm">
                <Link href={`/captures/${game.version.slug}`} className="underline hover:text-accent">
                  Manquants et où les trouver
                </Link>
                <Link href={`/jeux/${game.version.slug}`} className="text-muted underline hover:text-foreground">
                  Cocher dans le Pokédex
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {others.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">{games.length === 0 ? "Choisir un jeu" : "Commencer un autre jeu"}</h2>
          {others.map((generation) => (
            <div key={generation.id} className="flex flex-wrap items-baseline gap-2 text-sm">
              <span className="w-full text-xs text-muted sm:w-28">{generation.nameFr}</span>
              {generation.versions.map((version) => (
                <Link key={version.id} href={`/captures/${version.slug}`} className="rounded-full border border-border bg-card px-3 py-1 hover:border-accent">
                  {version.nameFr}
                </Link>
              ))}
            </div>
          ))}
        </section>
      )}
    </>
  );
}
