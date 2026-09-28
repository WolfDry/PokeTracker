"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { dlcVersionSlugs, isDlcVersion, isHiddenVersion } from "@/lib/data/filters";
import { getExtraEntries } from "@/lib/data/pokedex-extras";
import { getPokedexPages } from "@/lib/data/pokedex-pages";
import { prisma } from "@/lib/prisma";

export type TypeRef = { slug: string; nameFr: string };

/** Un Pokémon proposé pour l'équipe : une forme (par défaut, ou alternative aux types différents). */
export type TeamOption = {
  pokemonId: number;
  speciesId: number;
  nameFr: string;
  /** Types tels qu'ils sont dans le jeu (Mélofée est Normal avant la 6e génération). */
  types: TypeRef[];
};

export type TeamBuilderData = {
  game: { slug: string; nameFr: string; generation: { id: number; nameFr: string }; region: string };
  /** Dans l'ordre du Pokédex du jeu, chaque forme alternative après sa forme par défaut. */
  options: TeamOption[];
  /** Types de la génération, dans l'ordre PokeAPI (Normal, Combat, Vol…). */
  types: TypeRef[];
  /** `chart[a][d]` : multiplicateur d'une attaque du type `types[a]` sur un Pokémon de type `types[d]`. */
  chart: number[][];
};

type RawType = { id: number; slug: string; nameFr: string };
const typeSelect = { select: { id: true, slug: true, nameFr: true } } as const;

/**
 * Tout ce qu'il faut pour composer une équipe dans un jeu : les Pokémon de ses Pokédex (extensions
 * comprises : Isolarmure et Couronneige pour Épée) et de la liste « hors Pokédex régional », avec
 * leurs types de l'époque, et la table des types de sa génération.
 */
export async function getTeamBuilderData(versionSlug: string): Promise<TeamBuilderData | null> {
  cacheLife("max");
  cacheTag("reference");

  if (isHiddenVersion(versionSlug) || isDlcVersion(versionSlug)) return null;
  const version = await prisma.version.findUnique({
    where: { slug: versionSlug },
    select: {
      id: true,
      slug: true,
      nameFr: true,
      versionGroup: { select: { slug: true, order: true, generation: { select: { id: true, nameFr: true } } } },
    },
  });
  if (!version) return null;

  // La page Pokédex du jeu regroupe ses Pokédex (Galar + Isolarmure + Couronneige) ; Colosseum et XD n'ont que le national.
  const pages = await getPokedexPages();
  const page = pages.find((p) => p.games.some((g) => g.slug === versionSlug));
  if (!page) return null;
  const dexSpecies = await Promise.all(
    page.dexes.map((d) =>
      prisma.pokedexEntry.findMany({ where: { pokedex: { slug: d.slug } }, orderBy: { number: "asc" }, select: { speciesId: true } }),
    ),
  );
  const extras = await getExtraEntries(version.versionGroup.slug);
  const speciesIds = [...new Set([...dexSpecies.flat().map((e) => e.speciesId), ...extras.map((e) => e.species.id)])];

  // Les formes apparues dans une extension du jeu (Ramoloss de Galar dans Isolarmure) comptent aussi.
  const dlcGroups = await prisma.versionGroup.findMany({
    where: { versions: { some: { slug: { in: dlcVersionSlugs(version.slug) } } } },
    select: { order: true },
  });
  const maxOrder = Math.max(version.versionGroup.order, ...dlcGroups.map((g) => g.order));
  const groupOrder = new Map((await prisma.versionGroup.findMany({ select: { id: true, order: true } })).map((g) => [g.id, g.order]));

  const generationId = version.versionGroup.generation.id;
  const pokemons = await prisma.pokemon.findMany({
    where: { speciesId: { in: speciesIds } },
    orderBy: { id: "asc" },
    select: {
      id: true,
      slug: true,
      speciesId: true,
      isDefault: true,
      isBattleOnly: true,
      introducedVersionGroupId: true,
      nameFr: true,
      formNameFr: true,
      species: { select: { nameFr: true } },
      type1: typeSelect,
      type2: typeSelect,
      pastTypes: { orderBy: { generationId: "asc" }, select: { generationId: true, type1: typeSelect, type2: typeSelect } },
    },
  });

  // Types en vigueur dans la génération du jeu : les plus anciens types encore valables, sinon les actuels.
  const typesInGame = (p: (typeof pokemons)[number]): RawType[] => {
    const past = p.pastTypes.find((t) => t.generationId >= generationId);
    return [past?.type1 ?? p.type1, past ? past.type2 : p.type2].filter((t) => t !== null);
  };
  const sameTypes = (a: RawType[], b: RawType[]) => a.length === b.length && a.every((t) => b.some((o) => o.id === t.id));

  const bySpecies = new Map<number, TeamOption[]>();
  const defaults = new Map(pokemons.filter((p) => p.isDefault).map((p) => [p.speciesId, typesInGame(p)]));
  for (const p of pokemons) {
    const types = typesInGame(p);
    if (!p.isDefault) {
      // Formes utiles à une équipe : hors combat, déjà sorties dans ce jeu, et de types différents
      // (inutile de proposer Pikachu Casquette Originale, il a les mêmes faiblesses que Pikachu).
      const introduced = p.introducedVersionGroupId === null ? 0 : (groupOrder.get(p.introducedVersionGroupId) ?? Infinity);
      if (p.isBattleOnly || p.slug.includes("-totem") || introduced > maxOrder) continue;
      const base = defaults.get(p.speciesId);
      if (!base || sameTypes(types, base)) continue;
    }
    const nameFr = p.isDefault ? p.species.nameFr : (p.nameFr ?? `${p.species.nameFr} (${p.formNameFr ?? p.slug})`);
    const option = { pokemonId: p.id, speciesId: p.speciesId, nameFr, types: types.map(({ slug, nameFr }) => ({ slug, nameFr })) };
    // La forme par défaut en tête (les ids des formes par défaut sont les plus petits).
    bySpecies.set(p.speciesId, [...(bySpecies.get(p.speciesId) ?? []), option]);
  }

  const efficacy = await prisma.typeEfficacy.findMany({
    where: { generationId },
    select: { attackTypeId: true, defenseTypeId: true, factor: true },
  });
  const typeIds = [...new Set(efficacy.map((e) => e.attackTypeId))].sort((a, b) => a - b);
  const typeRows = await prisma.type.findMany({ where: { id: { in: typeIds } }, orderBy: { id: "asc" }, select: { slug: true, nameFr: true } });
  const index = new Map(typeIds.map((id, i) => [id, i]));
  const chart = typeIds.map(() => typeIds.map(() => 1));
  for (const e of efficacy) chart[index.get(e.attackTypeId)!][index.get(e.defenseTypeId)!] = e.factor / 100;

  return {
    game: { slug: version.slug, nameFr: version.nameFr, generation: version.versionGroup.generation, region: page.title },
    options: speciesIds.flatMap((id) => bySpecies.get(id) ?? []),
    types: typeRows,
    chart,
  };
}
