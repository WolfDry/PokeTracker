"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { card, dexNumber, gameButton, pillButton } from "@/components/ui";
import { gameTintStyle, NATIONAL_MASCOT, NATIONAL_TINT } from "@/lib/data/game-catalog";
import type { HomeGeneration } from "@/lib/data/games";
import { useGameStore } from "@/store/game-store";

/**
 * Haut de l'accueil : la partie en cours (dernier jeu ouvert, mémorisé dans le navigateur),
 * ou une invitation à choisir un jeu à la première visite. La carte prend la teinte du jeu.
 */
export function CurrentGame({ generations }: { generations: HomeGeneration[] }) {
  const game = useGameStore((state) => state.game);
  const hydrated = useGameStore((state) => state.hydrated);

  // Le jeu mémorisé n'est connu qu'après l'hydratation : on réserve la place de la carte d'ici là.
  if (!hydrated) return <div aria-hidden className="h-[290px] animate-pulse rounded-[22px] bg-surface-2 sm:h-[311px] sm:rounded-3xl" />;

  if (!game) {
    return (
      <div className="flex flex-col justify-center gap-3 py-2">
        <p className="t-caption">Compagnon d&apos;aventure</p>
        <h1 className="t-display font-display font-bold">Quel jeu as-tu dans les mains&nbsp;?</h1>
        <p className="max-w-md text-ink-2">Choisis-le dans la frise : on s&apos;en souviendra pour ta prochaine visite.</p>
      </div>
    );
  }

  const generation = generations.find((g) => g.games.some((v) => v.slug === game.slug));
  const version = generation?.games.find((v) => v.slug === game.slug);
  const national = game.kind === "national";
  const mascot = national ? NATIONAL_MASCOT : (version?.mascot ?? null);
  const dex = national ? NATIONAL_MASCOT : (version?.mascotDex ?? null);
  const tint = national ? NATIONAL_TINT : version?.tint;
  const subtitle = national ? "Toutes générations" : generation && `Génération ${generation.numeral} · ${generation.region}`;
  const href = `/jeu/${game.slug}`;

  return (
    <div
      style={gameTintStyle(tint)}
      className={`${card} game-tint flex flex-col gap-4 rounded-[22px] p-4 sm:flex-row sm:items-center sm:gap-8 sm:rounded-3xl sm:p-6`}
    >
      <div className="flex items-center gap-4 sm:contents">
        <PokedexScreen mascot={mascot} dex={dex} />
        <div className="min-w-0 space-y-1 sm:space-y-1.5">
          <p className="flex items-center gap-2 t-caption font-bold">
            <span aria-hidden className="size-[7px] shrink-0 rounded-full bg-game shadow-[0_0_0_3px_var(--game-soft)] sm:size-2" />
            Ta partie en cours
          </p>
          <h1 className="font-display text-[25px] leading-[29px] font-bold tracking-[-0.015em] text-balance sm:text-[44px] sm:leading-[50px] sm:tracking-[-0.02em]">
            {game.nameFr}
          </h1>
          {subtitle && <p className="t-small text-ink-2 sm:text-[15px] sm:leading-6">{subtitle}</p>}
          {dex !== null && (
            <span className="inline-block rounded-md bg-game-soft px-[7px] py-[3px] t-lcd text-game-text sm:hidden">N° {dexNumber(dex, 4)}</span>
          )}
          <div className="hidden flex-wrap gap-2.5 pt-4 sm:flex">
            <Link href={href} className={gameButton}>
              Continuer
              <ArrowRightIcon />
            </Link>
            <a href="#jeux" className={pillButton}>
              Changer de jeu
            </a>
          </div>
        </div>
      </div>
      {/* Sur mobile, les actions prennent toute la largeur sous la carte. */}
      <div className="flex flex-col gap-2 sm:hidden">
        <Link href={href} className={`${gameButton} h-[52px]`}>
          Continuer
          <ArrowRightIcon />
        </Link>
        <a href="#jeux" className={pillButton}>
          Changer de jeu
        </a>
      </div>
    </div>
  );
}

/**
 * La mascotte dans l'écran du Pokédex : cadre Surface 2 au coin bas gauche arrondi, deux voyants au-dessus,
 * écran quadrillé à la teinte du jeu avec le n° national en afficheur ; bouton et haut-parleur dessous (dès `sm`).
 */
function PokedexScreen({ mascot, dex }: { mascot: number | null; dex: number | null }) {
  return (
    <div className="w-[124px] shrink-0 rounded-[14px_14px_14px_28px] bg-surface-2 px-[9px] pt-2 pb-2.5 sm:w-[236px] sm:rounded-[20px_20px_20px_44px] sm:px-3.5 sm:pt-3 sm:pb-3.5">
      <div aria-hidden className="mb-1.5 flex justify-center gap-[7px] sm:mb-2 sm:gap-2.5">
        <span className="size-[5px] rounded-full bg-led-red sm:size-[7px]" />
        <span className="size-[5px] rounded-full bg-led-red sm:size-[7px]" />
      </div>
      <div className="relative grid h-[104px] place-items-center overflow-hidden rounded-[9px] pokedex-screen sm:h-[196px] sm:rounded-xl">
        {mascot !== null && <PokemonSprite pokemonId={mascot} alt="" size={172} className="size-24 object-contain sm:size-[172px]" />}
        {dex !== null && (
          <span className="absolute bottom-2 left-2 hidden rounded-md bg-surface px-[7px] py-[3px] t-lcd text-game-text sm:block">
            N° {dexNumber(dex, 4)}
          </span>
        )}
      </div>
      <div aria-hidden className="mt-2.5 hidden items-center justify-between px-1 sm:flex">
        <span className="size-3.5 rounded-full bg-ink-3" />
        <span className="flex flex-col gap-[3px]">
          <span className="h-0.5 w-[26px] rounded-full bg-line-strong" />
          <span className="h-0.5 w-[26px] rounded-full bg-line-strong" />
          <span className="h-0.5 w-[26px] rounded-full bg-line-strong" />
        </span>
      </div>
    </div>
  );
}
