"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { humanizeSlug, isHiddenVersion } from "@/lib/data/filters";
import { prisma } from "@/lib/prisma";

export type SpeciesEncounterSummary = {
  version: { id: number; slug: string; nameFr: string };
  locations: {
    id: number;
    slug: string;
    nameFr: string;
    methods: string[];
    minLevel: number;
    maxLevel: number;
  }[];
};

export async function getSpeciesById(id: number) {
  cacheLife("max");
  cacheTag("reference");

  const species = await prisma.species.findUnique({
    where: { id },
    include: {
      generation: { select: { id: true, nameFr: true } },
      pokemons: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          slug: true,
          isDefault: true,
          formNameFr: true,
          height: true,
          weight: true,
          type1: { select: { slug: true, nameFr: true } },
          type2: { select: { slug: true, nameFr: true } },
        },
      },
      pokedexEntries: {
        orderBy: { pokedexId: "asc" },
        select: {
          number: true,
          pokedex: {
            select: {
              id: true,
              slug: true,
              nameFr: true,
              isMainSeries: true,
              versionGroups: {
                select: {
                  versionGroup: {
                    select: {
                      order: true,
                      versions: { orderBy: { id: "asc" }, select: { id: true, slug: true, nameFr: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!species) return null;

  const defaultPokemon = species.pokemons.find((p) => p.isDefault) ?? species.pokemons[0];

  // Pokédex régionaux → jeux dans lesquels l'espèce figure.
  const pokedexes = species.pokedexEntries
    .filter((entry) => entry.pokedex.isMainSeries && entry.pokedex.slug !== "national")
    .map((entry) => ({
      id: entry.pokedex.id,
      slug: entry.pokedex.slug,
      nameFr: entry.pokedex.nameFr,
      number: entry.number,
      versions: entry.pokedex.versionGroups
        .sort((a, b) => a.versionGroup.order - b.versionGroup.order)
        .flatMap((vg) => vg.versionGroup.versions)
        .filter((v) => !isHiddenVersion(v.slug)),
    }));

  return {
    id: species.id,
    slug: species.slug,
    nameFr: species.nameFr,
    nameEn: species.nameEn,
    genusFr: species.genusFr,
    generation: species.generation,
    isLegendary: species.isLegendary,
    isMythical: species.isMythical,
    isBaby: species.isBaby,
    captureRate: species.captureRate,
    defaultPokemon: {
      ...defaultPokemon,
      types: [defaultPokemon.type1, defaultPokemon.type2].filter((t) => t !== null),
    },
    forms: species.pokemons
      .filter((p) => !p.isDefault)
      .map((p) => ({
        ...p,
        formNameFr: p.formNameFr ?? humanizeSlug(p.slug),
        types: [p.type1, p.type2].filter((t) => t !== null),
      })),
    pokedexes,
  };
}

/** Lieux de rencontre d'une espèce (toutes formes confondues), regroupés par jeu puis par lieu. */
export async function getSpeciesEncounters(speciesId: number): Promise<SpeciesEncounterSummary[]> {
  cacheLife("max");
  cacheTag("reference");

  const encounters = await prisma.encounter.findMany({
    where: { pokemon: { speciesId }, version: { slug: { not: { endsWith: "-japan" } } } },
    select: {
      minLevel: true,
      maxLevel: true,
      version: { select: { id: true, slug: true, nameFr: true, versionGroup: { select: { order: true } } } },
      method: { select: { nameFr: true, order: true } },
      locationArea: { select: { location: { select: { id: true, slug: true, nameFr: true } } } },
    },
  });

  type LocationAcc = SpeciesEncounterSummary["locations"][number] & { methodOrder: Map<string, number> };
  const byVersion = new Map<number, { version: SpeciesEncounterSummary["version"]; order: number; locations: Map<number, LocationAcc> }>();

  for (const e of encounters) {
    const versionEntry = byVersion.get(e.version.id) ?? {
      version: { id: e.version.id, slug: e.version.slug, nameFr: e.version.nameFr },
      order: e.version.versionGroup.order,
      locations: new Map<number, LocationAcc>(),
    };
    const location = e.locationArea.location;
    const locationEntry = versionEntry.locations.get(location.id) ?? {
      id: location.id,
      slug: location.slug,
      nameFr: location.nameFr,
      methods: [],
      methodOrder: new Map<string, number>(),
      minLevel: e.minLevel,
      maxLevel: e.maxLevel,
    };
    locationEntry.methodOrder.set(e.method.nameFr, e.method.order);
    locationEntry.minLevel = Math.min(locationEntry.minLevel, e.minLevel);
    locationEntry.maxLevel = Math.max(locationEntry.maxLevel, e.maxLevel);
    versionEntry.locations.set(location.id, locationEntry);
    byVersion.set(e.version.id, versionEntry);
  }

  return [...byVersion.values()]
    .sort((a, b) => a.order - b.order || a.version.id - b.version.id)
    .map((entry) => ({
      version: entry.version,
      locations: [...entry.locations.values()]
        .sort((a, b) => a.nameFr.localeCompare(b.nameFr, "fr"))
        .map(({ methodOrder, ...location }) => ({
          ...location,
          methods: [...methodOrder.entries()].sort((a, b) => a[1] - b[1]).map(([name]) => name),
        })),
    }));
}
