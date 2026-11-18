"use client";

import type { ChecklistEntry } from "@/components/capture-checklist";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { SpoilerSprite } from "@/components/spoiler-sprite";

type Props = { entry: ChecklistEntry; caught: boolean; shiny: boolean; size: number; className?: string; alt?: string };

/**
 * Sprite d'un Pokémon du living dex. Au shiny dex : chromatique s'il est obtenu, sinon soumis au mode spoiler
 * (sprite normal tant que les shinies manquants sont masqués).
 */
export function DexSprite({ entry, caught, shiny, size, className, alt = "" }: Props) {
  const props = { pokemonId: entry.species.pokemonId, fallbackId: entry.species.id, alt, size, className };
  return shiny && !caught ? <SpoilerSprite {...props} /> : <PokemonSprite {...props} shiny={shiny} />;
}

/** Formes attrapées d'une espèce sur une case de la mosaïque ou d'une boîte : « 3/19 », en couleur une fois complet. */
export function FormsBadge({ caught, total, className = "" }: { caught: number; total: number; className?: string }) {
  const complete = caught === total;
  return (
    <span
      aria-hidden
      className={`absolute rounded-full px-1 font-mono text-[9px] leading-[13px] font-bold ${complete ? "bg-game text-on-game" : "border border-line bg-surface text-ink-2"} ${className}`}
    >
      {caught}/{total}
    </span>
  );
}
