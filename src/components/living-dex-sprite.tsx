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
