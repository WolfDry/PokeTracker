"use cache";

import { cacheLife, cacheTag } from "next/cache";
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

export async function searchAll(rawQuery: string) {
  cacheLife("days");
  cacheTag("reference");

  let query = normalize(rawQuery);
  // "025" doit trouver le n° 25.
  if (/^\d+$/.test(query)) query = String(Number(query));
  if (query.length === 0) return null;

  const index = await getSearchIndex();
  return {
    query,
    species: rank(index.species, query, (s) => [s.nameFr, s.nameEn, String(s.id)], LIMITS.species),
    versions: rank(index.versions, query, (v) => [v.nameFr, v.slug], LIMITS.versions),
    locations: rank(index.locations, query, (l) => [l.nameFr, l.nameEn], LIMITS.locations),
  };
}
