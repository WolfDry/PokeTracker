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
  const [id, setId] = useState(pokemonId);
  return (
    <Image
      src={spriteUrl(id, { shiny })}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      className={className}
      onError={() => {
        if (fallbackId !== undefined && id !== fallbackId) setId(fallbackId);
      }}
    />
  );
}
