"use client";

import Image from "next/image";
import { useState } from "react";
import { spriteUrl } from "@/lib/sprites";

type Props = {
  pokemonId: number;
  /** Forme de repli si le sprite de la forme n'existe pas (quelques formes manquent chez PokeAPI). */
  fallbackId?: number;
  alt: string;
  shiny?: boolean;
  size?: number;
  className?: string;
};

/** Sprite 96×96 rendu net (pixel-art, cf. `img[data-sprite]` dans globals.css). */
export function PokemonSprite({ pokemonId, fallbackId, alt, shiny = false, size = 96, className }: Props) {
  const [id, setId] = useState(pokemonId);
  return (
    <Image
      src={spriteUrl(id, { shiny })}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      data-sprite
      className={className}
      onError={() => {
        if (fallbackId !== undefined && id !== fallbackId) setId(fallbackId);
      }}
    />
  );
}
