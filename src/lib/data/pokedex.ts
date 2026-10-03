"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export type PokedexGridEntry = {
  number: number;
  species: {
    id: number;
    nameFr: string;
    /** Forme affichée (sprite et types) : la forme régionale de la région du Pokédex s'il y en a une, sinon la forme par défaut. */
    pokemonId: number;
    types: { slug: string; nameFr: string }[];
  };
};

/**
 * Suffixe des formes régionales qu'on rencontre dans chaque Pokédex : dans celui d'Alola, Rattata est
 * Rattata d'Alola (`rattata-alola`). Kitakami et Myrtille, rattachés à Paldea par PokeAPI, n'ont pas de
 * forme propre à leur région.
 */
const REGIONAL_FORM_SUFFIX: Record<string, string> = {
  "original-alola": "alola",
  "original-melemele": "alola",
  "original-akala": "alola",
  "original-ulaula": "alola",
  "original-poni": "alola",
  "updated-alola": "alola",
  "updated-melemele": "alola",
  "updated-akala": "alola",
  "updated-ulaula": "alola",
  "updated-poni": "alola",
  galar: "galar",
  "isle-of-armor": "galar",
  "crown-tundra": "galar",
  hisui: "hisui",
  paldea: "paldea",
};

type FormRow = { id: number; slug: string; isDefault: boolean };

/**
 * Forme régionale d'une espèce (`meowth-galar`, `tauros-paldea-combat-breed` : la première si la région en a
 * plusieurs), sans les formes « totem » ni les Pikachu à casquette.
 */
function regionalForm<T extends FormRow>(speciesSlug: string, pokemons: T[], suffix: string | undefined) {
  if (!suffix) return undefined;
  const prefix = `${speciesSlug}-${suffix}`;
  return pokemons
    .filter((p) => !p.isDefault && (p.slug === prefix || p.slug.startsWith(`${prefix}-`)) && !p.slug.includes("totem") && !p.slug.endsWith("-cap"))
    .sort((a, b) => a.id - b.id)[0];
}

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
              slug: true,
              nameFr: true,
              pokemons: {
                orderBy: { id: "asc" },
                select: {
                  id: true,
                  slug: true,
                  isDefault: true,
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

  const suffix = REGIONAL_FORM_SUFFIX[pokedex.slug];
  const entries: PokedexGridEntry[] = pokedex.entries.map((entry) => {
    const { pokemons } = entry.species;
    const pokemon = regionalForm(entry.species.slug, pokemons, suffix) ?? pokemons.find((p) => p.isDefault) ?? pokemons[0];
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

export type VersionPokedexSummary = { id: number; slug: string; nameFr: string; speciesIds: number[] };

/** Pokédex principaux d'un jeu avec les espèces qu'ils contiennent — le national si le jeu n'en a pas (Colosseum, XD). */
export async function getVersionPokedexes(versionId: number): Promise<VersionPokedexSummary[]> {
  cacheLife("max");
  cacheTag("reference");

  const select = { id: true, slug: true, nameFr: true, entries: { orderBy: { number: "asc" as const }, select: { speciesId: true } } };
  const version = await prisma.version.findUnique({
    where: { id: versionId },
    select: {
      versionGroup: {
        select: { pokedexes: { orderBy: { pokedexId: "asc" }, select: { pokedex: { select: { ...select, isMainSeries: true } } } } },
      },
    },
  });
  if (!version) return [];

  let pokedexes = version.versionGroup.pokedexes.map((p) => p.pokedex).filter((p) => p.isMainSeries);
  if (pokedexes.length === 0) {
    const national = await prisma.pokedex.findUnique({ where: { slug: "national" }, select: { ...select, isMainSeries: true } });
    pokedexes = national ? [national] : [];
  }
  return pokedexes.map((p) => ({ id: p.id, slug: p.slug, nameFr: p.nameFr, speciesIds: p.entries.map((e) => e.speciesId) }));
}
