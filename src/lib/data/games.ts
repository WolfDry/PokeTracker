"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { isDlcVersion, isHiddenVersion } from "@/lib/data/filters";
import { prisma } from "@/lib/prisma";

// Données de référence : elles ne changent qu'à l'import, on les cache au maximum.
// `cacheTag("reference")` permet de tout invalider après un `npm run import:data`.

export async function getGenerationsWithGames() {
  cacheLife("max");
  cacheTag("reference");

  const generations = await prisma.generation.findMany({
    orderBy: { id: "asc" },
    include: {
      regions: { select: { nameFr: true } },
      versionGroups: {
        orderBy: { order: "asc" },
        include: {
          pokedexes: { select: { pokedex: { select: { isMainSeries: true } } } },
          versions: {
            orderBy: { id: "asc" },
            include: { coverage: { select: { status: true, encounterCount: true } } },
          },
        },
      },
    },
  });

  return generations.map((generation) => ({
    id: generation.id,
    nameFr: generation.nameFr,
    regionNames: generation.regions.map((r) => r.nameFr),
    versions: generation.versionGroups.flatMap((group) => {
      // Jeux visibles : ceux qui ont un Pokédex principal ou des rencontres
      // (exclut par exemple "Champions", qui n'a ni l'un ni l'autre).
      const hasMainPokedex = group.pokedexes.some((p) => p.pokedex.isMainSeries);
      return group.versions
        .filter((version) => !isHiddenVersion(version.slug))
        .filter((version) => hasMainPokedex || (version.coverage?.encounterCount ?? 0) > 0)
        .map((version) => ({
          id: version.id,
          slug: version.slug,
          nameFr: version.nameFr,
          coverage: version.coverage?.status ?? "NONE",
        }));
    }),
  }));
}

export async function getVersionBySlug(slug: string) {
  cacheLife("max");
  cacheTag("reference");

  const version = await prisma.version.findUnique({
    where: { slug },
    include: {
      coverage: true,
      versionGroup: {
        include: {
          generation: { select: { id: true, nameFr: true } },
          versions: { orderBy: { id: "asc" }, select: { id: true, slug: true, nameFr: true } },
          pokedexes: {
            orderBy: { pokedexId: "asc" },
            select: {
              pokedex: {
                select: {
                  id: true,
                  slug: true,
                  nameFr: true,
                  descriptionFr: true,
                  isMainSeries: true,
                  _count: { select: { entries: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!version) return null;

  return {
    id: version.id,
    slug: version.slug,
    nameFr: version.nameFr,
    coverage: version.coverage,
    generation: version.versionGroup.generation,
    /** Versions jumelles (Rouge ↔ Bleu), pour naviguer entre elles. */
    siblings: version.versionGroup.versions.filter((v) => v.id !== version.id && !isHiddenVersion(v.slug)),
    pokedexes: version.versionGroup.pokedexes
      .map((p) => p.pokedex)
      .filter((p) => p.isMainSeries)
      .map((p) => ({ id: p.id, slug: p.slug, nameFr: p.nameFr, descriptionFr: p.descriptionFr, entryCount: p._count.entries })),
  };
}

export async function getVersionSlugs() {
  cacheLife("max");
  cacheTag("reference");
  const versions = await prisma.version.findMany({ select: { slug: true } });
  return versions.map((v) => v.slug);
}

/** Jeux proposés dans les formulaires (chasse shiny, ajout d'un shiny) : par génération, sans les extensions. */
export async function getGameOptions() {
  cacheLife("max");
  cacheTag("reference");

  const generations = await getGenerationsWithGames();
  return generations
    .map((g) => ({ id: g.id, nameFr: g.nameFr, versions: g.versions.filter((v) => !isDlcVersion(v.slug)).map(({ id, slug, nameFr }) => ({ id, slug, nameFr })) }))
    .filter((g) => g.versions.length > 0);
}
