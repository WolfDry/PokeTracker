"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { HIDDEN_LOCATION_PREFIX } from "@/lib/data/filters";
import { getGenerationsWithGames } from "@/lib/data/games";
import { prisma } from "@/lib/prisma";
import { normalize, rank } from "@/lib/search";

export type SpeciesHit = {
  id: number;
  nameFr: string;
  nameEn: string;
  pokemonId: number;
  types: { slug: string; nameFr: string }[];
};
export type VersionHit = { id: number; slug: string; nameFr: string; generationNameFr: string };
export type LocationHit = { id: number; slug: string; nameFr: string; nameEn: string; regionNameFr: string | null; hasEncounters: boolean };

/** Tout ce qui est cherchable, chargé une fois et mis en cache. */
export async function getSearchIndex() {
  cacheLife("max");
  cacheTag("reference");

  const [species, generations, locations, areasWithEncounters] = await Promise.all([
    prisma.species.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        nameFr: true,
        nameEn: true,
        pokemons: {
          where: { isDefault: true },
          select: { id: true, type1: { select: { slug: true, nameFr: true } }, type2: { select: { slug: true, nameFr: true } } },
        },
      },
    }),
    getGenerationsWithGames(),
    prisma.location.findMany({
      where: { slug: { not: { startsWith: HIDDEN_LOCATION_PREFIX } } },
      orderBy: { nameFr: "asc" },
      select: { id: true, slug: true, nameFr: true, nameEn: true, region: { select: { nameFr: true } } },
    }),
    prisma.locationArea.findMany({ where: { encounters: { some: {} } }, select: { locationId: true } }),
  ]);

  const locationIdsWithEncounters = new Set(areasWithEncounters.map((a) => a.locationId));

  return {
    species: species.map<SpeciesHit>((s) => ({
      id: s.id,
      nameFr: s.nameFr,
      nameEn: s.nameEn,
      pokemonId: s.pokemons[0].id,
      types: [s.pokemons[0].type1, s.pokemons[0].type2].filter((t) => t !== null),
    })),
    versions: generations.flatMap((g) =>
      g.versions.map<VersionHit>((v) => ({ id: v.id, slug: v.slug, nameFr: v.nameFr, generationNameFr: g.nameFr })),
    ),
    locations: locations.map<LocationHit>((l) => ({
      id: l.id,
      slug: l.slug,
      nameFr: l.nameFr,
      nameEn: l.nameEn,
      regionNameFr: l.region?.nameFr ?? null,
      hasEncounters: locationIdsWithEncounters.has(l.id),
    })),
  };
}

const LIMITS = { species: 24, versions: 12, locations: 30 };

function normalizeQuery(rawQuery: string) {
  const query = normalize(rawQuery);
  // "025" doit trouver le n° 25.
  return /^\d+$/.test(query) ? String(Number(query)) : query;
}

export async function searchAll(rawQuery: string) {
  cacheLife("days");
  cacheTag("reference");

  const query = normalizeQuery(rawQuery);
  if (query.length === 0) return null;

  const index = await getSearchIndex();
  return {
    query,
    species: rank(index.species, query, (s) => [s.nameFr, s.nameEn, String(s.id)], LIMITS.species),
    versions: rank(index.versions, query, (v) => [v.nameFr, v.slug], LIMITS.versions),
    locations: rank(index.locations, query, (l) => [l.nameFr, l.nameEn], LIMITS.locations),
  };
}

export type SpeciesPick = { id: number; nameFr: string; pokemonId: number };

/** Espèces seules, pour les champs de sélection d'un Pokémon (nouvelle chasse, ajout d'un shiny). */
export async function searchSpecies(rawQuery: string, limit = 8): Promise<SpeciesPick[]> {
  cacheLife("days");
  cacheTag("reference");

  const query = normalizeQuery(rawQuery);
  if (query.length === 0) return [];
  const index = await getSearchIndex();
  return rank(index.species, query, (s) => [s.nameFr, s.nameEn, String(s.id)], limit).results.map((s) => ({
    id: s.id,
    nameFr: s.nameFr,
    pokemonId: s.pokemonId,
  }));
}
