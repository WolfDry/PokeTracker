import "server-only";

import { getVersionPokedexes } from "@/lib/data/pokedex";
import { prisma } from "@/lib/prisma";

// Captures d'un utilisateur : données personnelles, lues à la requête — jamais en `use cache`
// (contrairement au reste de src/lib/data). Toujours appelé avec l'id de l'utilisateur connecté.

export type DexProgress = { id: number; slug: string; nameFr: string; total: number; caught: number };

export type GameProgress = {
  version: { id: number; slug: string; nameFr: string };
  generationName: string;
  /** Espèces cochées dans ce jeu, tous Pokédex confondus. */
  captures: number;
  lastCaughtAt: Date | null;
  dexes: DexProgress[];
};

export async function getCapturedSpeciesIds(userId: string, versionId: number): Promise<number[]> {
  const rows = await prisma.capture.findMany({ where: { userId, versionId }, select: { speciesId: true } });
  return rows.map((r) => r.speciesId);
}

/** Avancement des Pokédex d'un jeu pour l'utilisateur. */
export async function getDexProgress(userId: string, versionId: number): Promise<DexProgress[]> {
  const [captured, pokedexes] = await Promise.all([getCapturedSpeciesIds(userId, versionId), getVersionPokedexes(versionId)]);
  const set = new Set(captured);
  return pokedexes.map((dex) => ({
    id: dex.id,
    slug: dex.slug,
    nameFr: dex.nameFr,
    total: dex.speciesIds.length,
    caught: dex.speciesIds.filter((id) => set.has(id)).length,
  }));
}

/** Jeux dans lesquels l'utilisateur a coché au moins un Pokémon, dernier jeu joué en premier. */
export async function getUserGames(userId: string): Promise<GameProgress[]> {
  const grouped = await prisma.capture.groupBy({ by: ["versionId"], where: { userId }, _count: { _all: true }, _max: { caughtAt: true } });
  if (grouped.length === 0) return [];

  const versions = await prisma.version.findMany({
    where: { id: { in: grouped.map((g) => g.versionId) } },
    select: { id: true, slug: true, nameFr: true, versionGroup: { select: { generation: { select: { nameFr: true } } } } },
  });

  const games = await Promise.all(
    versions.map(async (version): Promise<GameProgress> => {
      const stats = grouped.find((g) => g.versionId === version.id)!;
      return {
        version: { id: version.id, slug: version.slug, nameFr: version.nameFr },
        generationName: version.versionGroup.generation.nameFr,
        captures: stats._count._all,
        lastCaughtAt: stats._max.caughtAt,
        dexes: await getDexProgress(userId, version.id),
      };
    }),
  );
  return games.sort((a, b) => (b.lastCaughtAt?.getTime() ?? 0) - (a.lastCaughtAt?.getTime() ?? 0));
}

/** Jeux où une espèce est cochée, pour la fiche Pokémon. */
export async function getSpeciesCaptures(userId: string, speciesId: number) {
  const rows = await prisma.capture.findMany({
    where: { userId, speciesId },
    orderBy: { caughtAt: "desc" },
    select: { caughtAt: true, version: { select: { id: true, slug: true, nameFr: true } } },
  });
  return rows.map((r) => ({ ...r.version, caughtAt: r.caughtAt }));
}

/** Coche ou décoche une espèce dans un jeu (idempotent). */
export async function setCapture(userId: string, versionId: number, speciesId: number, captured: boolean) {
  if (captured) {
    await prisma.capture.upsert({
      where: { userId_speciesId_versionId: { userId, speciesId, versionId } },
      create: { userId, speciesId, versionId },
      update: {},
    });
  } else {
    await prisma.capture.deleteMany({ where: { userId, speciesId, versionId } });
  }
}
