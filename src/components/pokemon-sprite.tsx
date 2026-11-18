"use client";

import Image from "next/image";
import { useState } from "react";
import { spriteUrl } from "@/lib/sprites";

type Props = {
  pokemonId: number;
  /** Variante d'apparence (« vivillon-icy-snow ») : son image, et celle de `pokemonId` à défaut. */
  form?: string | null;
  /** Forme de repli si l'image de la forme n'existe pas (quelques formes manquent chez PokeAPI). */
  fallbackId?: number;
  alt: string;
  shiny?: boolean;
  size?: number;
  className?: string;
};

/** Image d'une forme (rendu Pokémon HOME, ou illustration officielle à défaut), affichée à `size` px. */
export function PokemonSprite({ pokemonId, form, fallbackId, alt, shiny = false, size = 96, className }: Props) {
  const sources = [
    ...new Set([
      ...(form ? [spriteUrl(pokemonId, { shiny, form })] : []),
      spriteUrl(pokemonId, { shiny }),
      ...(fallbackId !== undefined ? [spriteUrl(fallbackId, { shiny })] : []),
    ]),
  ];
  // On retient les échecs pour l'image demandée, pas pour l'image affichée : si la forme change (la carte reste
  // montée quand on change de jeu), le nouveau sprite s'affiche sans rechargement.
  const [failures, setFailures] = useState({ for: "", count: 0 });
  const count = failures.for === sources[0] ? failures.count : 0;
  const src = sources[Math.min(count, sources.length - 1)];
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      className={className}
      onError={() => {
        if (count < sources.length - 1) setFailures({ for: sources[0], count: count + 1 });
      }}
    />
  );
}
