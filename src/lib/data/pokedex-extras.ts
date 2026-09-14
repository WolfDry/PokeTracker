"use cache";

import { cacheLife, cacheTag } from "next/cache";
import type { PokedexGridEntry } from "@/lib/data/pokedex";
import { prisma } from "@/lib/prisma";

/**
 * Pokémon obtenables dans un jeu sans figurer dans son Pokédex régional (après le Pokédex national :
 * zones post-ligue, événements, évolutions par échange…). PokeAPI n'a pas cette donnée : la liste est
 * tenue à la main, par groupe de versions, en numéros du Pokédex national. À compléter jeu par jeu.
 */
const EXTRA_SPECIES_BY_VERSION_GROUP: Record<string, number[]> = {
  // Rouge Feu / Vert Feuille : îles Sevii, œufs et cadeaux, évolutions par échange, événements (Deoxys, Lugia, Ho-Oh).
  "firered-leafgreen": [
    163, 164, 165, 166, 167, 168, 170, 171, 172, 173, 174, 175, 176, 177, 178, 183, 184, 186, 187, 188, 189, 193, 194, 195, 198, 199, 200, 202, 204, 205, 208,
    209, 210, 211, 212, 214, 215, 218, 219, 223, 224, 225, 227, 228, 229, 230, 231, 232, 233, 235, 236, 238, 239, 240, 242, 246, 247, 248, 249, 250, 386,
  ],
};

/** Entrées « hors Pokédex régional » d'un groupe de versions, numérotées selon le national. */
export async function getExtraEntries(versionGroupSlug: string): Promise<PokedexGridEntry[]> {
  cacheLife("max");
  cacheTag("reference");

  const ids = EXTRA_SPECIES_BY_VERSION_GROUP[versionGroupSlug] ?? [];
  if (ids.length === 0) return [];

  const species = await prisma.species.findMany({
    where: { id: { in: ids } },
    orderBy: { id: "asc" },
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
  });

  return species.flatMap((s) => {
    const pokemon = s.pokemons[0];
    if (!pokemon) return [];
    return [
      {
        number: s.id,
        species: {
          id: s.id,
          nameFr: s.nameFr,
          pokemonId: pokemon.id,
          types: [pokemon.type1, pokemon.type2].filter((t) => t !== null),
        },
      },
    ];
  });
}
