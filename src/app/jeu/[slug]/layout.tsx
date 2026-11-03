import Link from "next/link";
import { notFound } from "next/navigation";
import { GameSync } from "@/components/game-sync";
import { GameTabs } from "@/components/game-tabs";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { dexNumber, pillButton } from "@/components/ui";
import { gameTintStyle } from "@/lib/data/game-catalog";
import { type GameBranding, getGame, getGameBranding, getGameOptions } from "@/lib/data/games";
import { NATIONAL_SLUG } from "@/lib/game";

// Ici plutôt que dans la page : les paramètres valent pour le résumé et pour chaque onglet.
export async function generateStaticParams() {
  const generations = await getGameOptions();
  return [NATIONAL_SLUG, ...generations.flatMap((g) => g.versions.map((v) => v.slug))].map((slug) => ({ slug }));
}

/** Cadre commun aux pages d'un jeu : teinte du jeu, en-tête, onglets ; le jeu devient la partie en cours. */
export default async function GameLayout({ children, params }: LayoutProps<"/jeu/[slug]">) {
  const { slug } = await params;
  const [game, branding] = await Promise.all([getGame(slug), getGameBranding(slug)]);
  if (!game || !branding) notFound();

  return (
    <div style={gameTintStyle(branding.tint)} className="game-tint space-y-6 sm:space-y-8">
      <GameSync game={game} />
      <div className="space-y-4 md:space-y-6">
        <GameHeader name={game.nameFr} branding={branding} />
        <GameTabs slug={game.slug} national={game.kind === "national"} />
      </div>
      {children}
    </div>
  );
}

/** Mascotte dans un petit écran de Pokédex, légende et nom du jeu, et retour au choix du jeu. */
function GameHeader({ name, branding }: { name: string; branding: GameBranding }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <div className="flex min-w-0 items-center gap-4 sm:gap-5">
        <div className="relative grid size-[72px] shrink-0 place-items-center overflow-hidden rounded-[12px_12px_12px_22px] pokedex-screen sm:size-[88px]">
          {branding.mascot !== null && <PokemonSprite pokemonId={branding.mascot} alt="" size={96} className="size-16 object-contain sm:size-20" />}
        </div>
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-2 t-caption font-bold">
            <span aria-hidden className="size-[7px] shrink-0 rounded-full bg-game shadow-[0_0_0_3px_var(--game-soft)]" />
            {branding.subtitle}
            {branding.mascotDex !== null && <span className="t-lcd font-normal text-game-text">N° {dexNumber(branding.mascotDex, 4)}</span>}
          </p>
          <h1 className="font-display text-[28px] leading-8 font-bold tracking-[-0.015em] text-balance sm:text-[40px] sm:leading-[46px] sm:tracking-[-0.02em]">
            {name}
          </h1>
        </div>
      </div>
      <Link href="/#jeux" className={`${pillButton} hidden h-10 px-4 text-sm sm:inline-flex`}>
        Changer de jeu
      </Link>
    </header>
  );
}
