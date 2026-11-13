"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { isDlcVersion, isHiddenVersion } from "@/lib/data/filters";
import { GAME_EXTRAS, type GameTint, NATIONAL_MASCOT, NATIONAL_TINT } from "@/lib/data/game-catalog";
import { type Game, NATIONAL_GAME, NATIONAL_SLUG } from "@/lib/game";
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
    versionGroupSlug: version.versionGroup.slug,
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

/** Jeu sélectionnable depuis l'accueil (versions DLC et masquées exclues), ou le National. */
export async function getGame(slug: string): Promise<Game | null> {
  cacheLife("max");
  cacheTag("reference");

  if (slug === NATIONAL_SLUG) return NATIONAL_GAME;
  if (isHiddenVersion(slug) || isDlcVersion(slug)) return null;
  const version = await getVersionBySlug(slug);
  if (!version) return null;
  return {
    kind: "version",
    id: version.id,
    slug: version.slug,
    nameFr: version.nameFr,
    generation: version.generation,
    versionGroupSlug: version.versionGroupSlug,
  };
}

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/**
 * Frise de l'accueil : une étape par génération (chiffre romain, région principale), ses jeux habillés
 * de leur mascotte. Les extensions se rattachent à leur jeu de base : pas d'entrée à part.
 */
export async function getHomeTimeline() {
  cacheLife("max");
  cacheTag("reference");

  const generations = await getGenerationsWithGames();
  // N° national de chaque mascotte (une forme : Primo-Groudon → 383), pour l'afficheur de l'écran.
  const mascots = await prisma.pokemon.findMany({
    where: { id: { in: Object.values(GAME_EXTRAS).map((extra) => extra.mascot) } },
    select: { id: true, speciesId: true },
  });
  const mascotDex = new Map(mascots.map((pokemon) => [pokemon.id, pokemon.speciesId]));

  return generations
    .map((generation) => ({
      id: generation.id,
      numeral: ROMAN_NUMERALS[generation.id - 1] ?? String(generation.id),
      region: generation.regionNames[0] ?? generation.nameFr,
      games: generation.versions
        .filter((version) => !isDlcVersion(version.slug))
        .map((version) => {
          const extra = GAME_EXTRAS[version.slug];
          return {
            slug: version.slug,
            nameFr: version.nameFr,
            mascot: extra?.mascot ?? null,
            mascotDex: (extra && mascotDex.get(extra.mascot)) ?? null,
            tint: extra ? { hue: extra.hue, chroma: extra.chroma } : null,
          };
        }),
    }))
    .filter((generation) => generation.games.length > 0);
}

export type GameBranding = { mascot: number | null; mascotDex: number | null; tint: GameTint | null; subtitle: string };

/** Habillage des pages d'un jeu, comme sur l'accueil : mascotte (et son n° national), teinte, légende « Génération I · Kanto ». */
export async function getGameBranding(slug: string): Promise<GameBranding | null> {
  cacheLife("max");
  cacheTag("reference");

  if (slug === NATIONAL_SLUG) return { mascot: NATIONAL_MASCOT, mascotDex: NATIONAL_MASCOT, tint: NATIONAL_TINT, subtitle: "Toutes générations" };
  for (const generation of await getHomeTimeline()) {
    const game = generation.games.find((v) => v.slug === slug);
    if (game) return { mascot: game.mascot, mascotDex: game.mascotDex, tint: game.tint, subtitle: `Génération ${generation.numeral} · ${generation.region}` };
  }
  return null;
}

/** Nombre d'espèces du Pokédex National (afficheur de la carte National). */
export async function getNationalSpeciesCount() {
  cacheLife("max");
  cacheTag("reference");

  return prisma.species.count();
}

export type HomeGeneration = Awaited<ReturnType<typeof getHomeTimeline>>[number];

/** Jeux proposés dans les formulaires (shasse shiny, ajout d'un shiny) : par génération, sans les extensions. */
export async function getGameOptions() {
  cacheLife("max");
  cacheTag("reference");

  const generations = await getGenerationsWithGames();
  return generations
    .map((g) => ({ id: g.id, nameFr: g.nameFr, versions: g.versions.filter((v) => !isDlcVersion(v.slug)).map(({ id, slug, nameFr }) => ({ id, slug, nameFr })) }))
    .filter((g) => g.versions.length > 0);
}
