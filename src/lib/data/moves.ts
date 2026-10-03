"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { isFixedDamage, type LearnableMove, moveCategory } from "@/lib/moves";
import { prisma } from "@/lib/prisma";

const typeSelect = { select: { slug: true, nameFr: true } } as const;

/**
 * Capacités offensives qu'une forme peut apprendre dans un jeu, telles qu'elles étaient dans ce jeu : type,
 * puissance et précision d'avant les changements ultérieurs (Morsure Normal en 1re génération), catégorie
 * selon le type avant la 4e. Une forme sans données propres (Pikachu Cosplayeur…) apprend comme sa forme
 * par défaut. Les plus puissantes d'abord.
 */
export async function getLearnableMoves(versionSlug: string, pokemonId: number): Promise<LearnableMove[]> {
  cacheLife("max");
  cacheTag("reference");

  const version = await prisma.version.findUnique({
    where: { slug: versionSlug },
    select: { versionGroup: { select: { id: true, order: true, generationId: true } } },
  });
  if (!version) return [];
  const group = version.versionGroup;

  const load = (id: number) =>
    prisma.pokemonMove.findMany({
      where: { pokemonId: id, versionGroupId: group.id },
      select: {
        method: true,
        level: true,
        move: {
          select: {
            id: true,
            slug: true,
            nameFr: true,
            damageClass: true,
            power: true,
            accuracy: true,
            type: typeSelect,
            pastValues: {
              select: { power: true, accuracy: true, type: typeSelect, changedInVersionGroup: { select: { order: true } } },
            },
          },
        },
      },
    });

  let rows = await load(pokemonId);
  if (rows.length === 0) {
    const pokemon = await prisma.pokemon.findUnique({
      where: { id: pokemonId },
      select: { isDefault: true, species: { select: { pokemons: { where: { isDefault: true }, select: { id: true } } } } },
    });
    const fallback = pokemon && !pokemon.isDefault ? pokemon.species.pokemons[0]?.id : undefined;
    if (fallback !== undefined) rows = await load(fallback);
  }

  return rows
    .map(({ method, level, move }): LearnableMove => {
      // Valeurs d'époque : pour chaque champ, le plus proche changement survenu après ce jeu.
      const later = move.pastValues
        .filter((p) => p.changedInVersionGroup.order > group.order)
        .sort((a, b) => a.changedInVersionGroup.order - b.changedInVersionGroup.order);
      const type = later.find((p) => p.type !== null)?.type ?? move.type;
      return {
        id: move.id,
        nameFr: move.nameFr,
        type,
        category: moveCategory(move.damageClass, type.slug, group.generationId),
        power: later.find((p) => p.power !== null)?.power ?? move.power,
        accuracy: later.find((p) => p.accuracy !== null)?.accuracy ?? move.accuracy,
        fixedDamage: isFixedDamage(move.slug),
        method,
        level,
      };
    })
    .sort((a, b) => (b.power ?? 0) - (a.power ?? 0) || a.nameFr.localeCompare(b.nameFr, "fr"));
}
