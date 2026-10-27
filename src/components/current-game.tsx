"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { card, largeButton, primaryButton, secondaryButton, spriteBox } from "@/components/ui";
import { NATIONAL_MASCOT } from "@/lib/data/game-catalog";
import type { HomeGeneration } from "@/lib/data/games";
import { useGameStore } from "@/store/game-store";

/**
 * Haut de l'accueil : la partie en cours (dernier jeu ouvert, mémorisé dans le navigateur),
 * ou une invitation à choisir un jeu à la première visite.
 */
export function CurrentGame({ generations }: { generations: HomeGeneration[] }) {
  const game = useGameStore((state) => state.game);
  const hydrated = useGameStore((state) => state.hydrated);

  // Le jeu mémorisé n'est connu qu'après l'hydratation : on réserve la place de la carte d'ici là.
  if (!hydrated) return <div aria-hidden className="h-48 animate-pulse rounded-lg bg-surface-2 sm:h-[226px]" />;

  if (!game) {
    return (
      <div className="flex flex-col justify-center gap-3 py-2">
        <p className="t-caption">Compagnon d&apos;aventure</p>
        <h1 className="t-display">Quel jeu as-tu dans les mains&nbsp;?</h1>
        <p className="max-w-md text-ink-2">Choisis-le dans la frise : on s&apos;en souviendra pour ta prochaine visite.</p>
      </div>
    );
  }

  const generation = generations.find((g) => g.games.some((v) => v.slug === game.slug));
  const mascot = game.kind === "national" ? NATIONAL_MASCOT : (generation?.games.find((v) => v.slug === game.slug)?.mascot ?? null);
  const subtitle = game.kind === "national" ? "Toutes générations" : generation && `Génération ${generation.numeral} · ${generation.region}`;
  const href = `/jeu/${game.slug}`;

  return (
    <div className={`${card} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-8 sm:p-6`}>
      <div className="flex items-center gap-4 sm:contents">
        <span className={`${spriteBox} size-24 sm:size-44`}>
          {mascot !== null && <PokemonSprite pokemonId={mascot} alt="" size={150} className="size-[82px] object-contain sm:size-[150px]" />}
        </span>
        <div className="min-w-0 space-y-0.5 sm:space-y-2">
          <p className="t-caption">Ta partie en cours</p>
          <h1 className="text-[30px] leading-9 font-extrabold tracking-[-0.02em] sm:text-[40px] sm:leading-[44px]">{game.nameFr}</h1>
          {subtitle && <p className="t-small text-ink-2">{subtitle}</p>}
          <div className="hidden flex-wrap gap-2 pt-3 sm:flex">
            <Link href={href} className={primaryButton}>
              Continuer
              <ArrowRightIcon />
            </Link>
            <a href="#jeux" className={secondaryButton}>
              Changer de jeu
            </a>
          </div>
        </div>
      </div>
      {/* Sur mobile, l'action principale prend toute la largeur sous la carte. */}
      <Link href={href} className={`${primaryButton} ${largeButton} sm:hidden`}>
        Continuer
        <ArrowRightIcon />
      </Link>
    </div>
  );
}
