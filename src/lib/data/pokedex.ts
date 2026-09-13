"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export type PokedexGridEntry = {
  number: number;
  species: {
    id: number;
    nameFr: string;
    /** Forme par défaut : sprite et types affichés dans la grille. */
    pokemonId: number;
    types: { slug: string; nameFr: string }[];
  };
};

export async function getPokedexBySlug(slug: string) {
  cacheLife("max");
  cacheTag("reference");

  const pokedex = await prisma.pokedex.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      nameFr: true,
      descriptionFr: true,
      entries: {
        orderBy: { number: "asc" },
        select: {
          number: true,
          species: {
            select: {
              id: true,
              nameFr: true,
              pokemons: {
                where: { isDefault: true },
                select: {
                  id: true,
                  type1: { select: { slug: true, nameFr: true } },
                  type2: { select: { slug: true, nameFr: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!pokedex) return null;

  const entries: PokedexGridEntry[] = pokedex.entries.map((entry) => {
    const pokemon = entry.species.pokemons[0];
    return {
      number: entry.number,
      species: {
        id: entry.species.id,
        nameFr: entry.species.nameFr,
        pokemonId: pokemon.id,
        types: [pokemon.type1, pokemon.type2].filter((t) => t !== null),
      },
    };
  });

  return { id: pokedex.id, slug: pokedex.slug, nameFr: pokedex.nameFr, descriptionFr: pokedex.descriptionFr, entries };
}
