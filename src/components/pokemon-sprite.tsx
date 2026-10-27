"use client";

import Image from "next/image";
import { useState } from "react";
import { spriteUrl } from "@/lib/sprites";

type Props = {
  pokemonId: number;
  /** Forme de repli si l'image de la forme n'existe pas (quelques formes manquent chez PokeAPI). */
  fallbackId?: number;
  alt: string;
  shiny?: boolean;
  size?: number;
  className?: string;
};

/** Image d'une forme (rendu Pokémon HOME, ou illustration officielle à défaut), affichée à `size` px. */
export function PokemonSprite({ pokemonId, fallbackId, alt, shiny = false, size = 96, className }: Props) {
  // On retient la forme dont l'image a échoué, pas l'id affiché : si `pokemonId` change (la carte reste montée
  // quand on change de jeu), le nouveau sprite s'affiche sans rechargement.
  const [failedId, setFailedId] = useState<number | null>(null);
  const id = failedId === pokemonId && fallbackId !== undefined ? fallbackId : pokemonId;
  return (
    <Image
      src={spriteUrl(id, { shiny })}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      className={className}
      onError={() => {
        if (fallbackId !== undefined && id !== fallbackId) setFailedId(pokemonId);
      }}
    />
  );
}
