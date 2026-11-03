"use client";

import { PokemonSprite } from "@/components/pokemon-sprite";
import { useSpoilerStore } from "@/store/spoiler-store";

type Props = Omit<Parameters<typeof PokemonSprite>[0], "shiny">;

/**
 * Sprite shiny d'un Pokémon pas encore obtenu (chasse en cours, shiny dex) : sprite normal tant que
 * le mode spoiler masque les shinies, shiny une fois révélés.
 */
export function SpoilerSprite(props: Props) {
  const revealed = useSpoilerStore((state) => state.shinyRevealed);
  return <PokemonSprite {...props} shiny={revealed} />;
}
