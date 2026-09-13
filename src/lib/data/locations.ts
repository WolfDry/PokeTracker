"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { isHiddenLocation, isHiddenVersion } from "@/lib/data/filters";
import { prisma } from "@/lib/prisma";

/** Un lieu et, pour chaque jeu où il a des rencontres, le nombre d'espèces qu'on y trouve. */
export async function getLocationBySlug(slug: string) {
  cacheLife("max");
  cacheTag("reference");

  if (isHiddenLocation(slug)) return null;
  const location = await prisma.location.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      nameFr: true,
      nameEn: true,
      region: { select: { nameFr: true } },
      areas: { orderBy: { id: "asc" }, select: { id: true, nameFr: true } },
    },
  });
  if (!location) return null;

  const encounters = await prisma.encounter.findMany({
    where: { locationArea: { locationId: location.id } },
    distinct: ["versionId", "pokemonId"],
    select: { versionId: true, pokemon: { select: { speciesId: true } } },
  });

  const speciesByVersion = new Map<number, Set<number>>();
  for (const e of encounters) {
    const set = speciesByVersion.get(e.versionId) ?? new Set<number>();
    set.add(e.pokemon.speciesId);
    speciesByVersion.set(e.versionId, set);
  }

  const versions = await prisma.version.findMany({
    where: { id: { in: [...speciesByVersion.keys()] } },
    select: { id: true, slug: true, nameFr: true, versionGroup: { select: { order: true } } },
  });

  return {
    ...location,
    versions: versions
      .filter((v) => !isHiddenVersion(v.slug))
      .sort((a, b) => a.versionGroup.order - b.versionGroup.order || a.id - b.id)
      .map((v) => ({ id: v.id, slug: v.slug, nameFr: v.nameFr, speciesCount: speciesByVersion.get(v.id)?.size ?? 0 })),
  };
}
