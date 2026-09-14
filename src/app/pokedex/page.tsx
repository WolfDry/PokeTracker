import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { ProgressBar } from "@/components/progress-bar";
import { StatusBadge } from "@/components/status-badge";
import { cardLink, spriteBox } from "@/components/ui";
import { getPokedexPagesProgress, type PokedexPageProgress } from "@/lib/data/captures";
import { getPokedexPages, type PokedexPage } from "@/lib/data/pokedex-pages";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Pokédex" };

export default async function PokedexListPage() {
  const pages = await getPokedexPages();
  const national = pages.find((p) => p.slug === "national");
  const regional = pages.filter((p) => p !== national);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Pokédex"
        title="Un Pokédex par région"
        intro="Chaque Pokédex regroupe les jeux qui le partagent. Ouvre-le, choisis ton jeu, coche tes captures."
      />

      {national && <NationalCard page={national} />}

      {/* L'avancement dépend de la session : les cartes s'affichent tout de suite à zéro, puis se remplissent. */}
      <Suspense fallback={<Cards pages={regional} progress={{}} />}>
        <CardsWithProgress pages={regional} />
      </Suspense>
    </div>
  );
}

async function CardsWithProgress({ pages }: { pages: PokedexPage[] }) {
  const user = await getCurrentUser();
  const progress = user ? await getPokedexPagesProgress(user.id, pages) : {};
  return <Cards pages={pages} progress={progress} />;
}

function Cards({ pages, progress }: { pages: PokedexPage[]; progress: Record<string, PokedexPageProgress> }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {pages.map((page) => (
        <li key={page.slug} className="flex">
          <PokedexCard page={page} progress={progress[page.slug]} />
        </li>
      ))}
    </ul>
  );
}

function PokedexCard({ page, progress }: { page: PokedexPage; progress?: PokedexPageProgress }) {
  const primary = page.dexes[0];
  const subs = page.dexes.slice(1);
  const game = progress?.game.nameFr ?? page.games[0]?.nameFr;
  return (
    <Link href={`/pokedex/${page.slug}`} className={`${cardLink} flex w-full flex-col gap-4 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="t-caption">{page.generation?.nameFr}</p>
          <h2 className="t-h1">{page.title}</h2>
        </div>
        <SpriteStrip sprites={page.sprites} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {page.games.map((g) => (
          <StatusBadge key={g.id}>{g.nameFr}</StatusBadge>
        ))}
      </div>
      <div className="mt-auto flex items-baseline justify-between gap-3 t-small">
        <span>
          <b className="font-bold text-ink">{primary.entryCount}</b> <span className="text-ink-2">Pokémon</span>
        </span>
        {subs.length > 0 && <span className="text-right text-ink-3">{subs.map((d) => `${d.nameFr} ${d.entryCount}`).join(" · ")}</span>}
      </div>
      <div className="border-t border-line pt-3">
        <ProgressBar caught={progress?.caught ?? 0} total={progress?.total ?? primary.entryCount} label={game} />
      </div>
    </Link>
  );
}

function NationalCard({ page }: { page: PokedexPage }) {
  return (
    <Link href={`/pokedex/${page.slug}`} className={`${cardLink} flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-6 py-5`}>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="t-caption">Toutes les générations</p>
        <h2 className="t-h1">Pokédex national</h2>
        <p className="t-small text-ink-2">
          Les {page.count} espèces, de Bulbizarre à la dernière génération. Pour retrouver un Pokémon sans savoir dans quel jeu il apparaît.
        </p>
      </div>
      <SpriteStrip sprites={page.sprites} />
    </Link>
  );
}

function SpriteStrip({ sprites }: { sprites: PokedexPage["sprites"] }) {
  return (
    <div className="flex shrink-0 gap-1.5">
      {sprites.map((s) => (
        <span key={s.pokemonId} className={`${spriteBox} size-14 rounded-sm`}>
          <PokemonSprite pokemonId={s.pokemonId} alt={s.nameFr} size={48} />
        </span>
      ))}
    </div>
  );
}
