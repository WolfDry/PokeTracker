import "server-only";

import type { HuntStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

// Chasses et shinies d'un utilisateur : données personnelles, lues à la requête — jamais en
// `use cache`. Toujours appelé avec l'id de l'utilisateur connecté ; chaque écriture filtre sur
// `userId` pour qu'on ne puisse pas toucher la chasse d'un autre en devinant son id.

export type ShinySpecies = { id: number; nameFr: string; pokemonId: number };
export type ShinyVersion = { id: number; slug: string; nameFr: string };

export type Hunt = {
  id: string;
  count: number;
  method: string | null;
  status: HuntStatus;
  startedAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  species: ShinySpecies;
  version: ShinyVersion;
  /** Shiny obtenu à la clôture de la chasse. */
  capture: { id: string; nickname: string | null; caughtAt: Date } | null;
};

export type Shiny = {
  id: string;
  encounters: number | null;
  method: string | null;
  nickname: string | null;
  note: string | null;
  caughtAt: Date;
  huntId: string | null;
  species: ShinySpecies;
  version: ShinyVersion;
};

const speciesSelect = { id: true, nameFr: true, pokemons: { where: { isDefault: true }, select: { id: true }, take: 1 } } as const;
const versionSelect = { id: true, slug: true, nameFr: true } as const;
const huntSelect = {
  id: true,
  count: true,
  method: true,
  status: true,
  startedAt: true,
  updatedAt: true,
  completedAt: true,
  species: { select: speciesSelect },
  version: { select: versionSelect },
  capture: { select: { id: true, nickname: true, caughtAt: true } },
} as const;
const shinySelect = {
  id: true,
  encounters: true,
  method: true,
  nickname: true,
  note: true,
  caughtAt: true,
  huntId: true,
  species: { select: speciesSelect },
  version: { select: versionSelect },
} as const;

type SpeciesRow = { id: number; nameFr: string; pokemons: { id: number }[] };
const toSpecies = (s: SpeciesRow): ShinySpecies => ({ id: s.id, nameFr: s.nameFr, pokemonId: s.pokemons[0]?.id ?? s.id });

/** Chasses de l'utilisateur, les plus récemment touchées en premier. */
export async function getHunts(userId: string, status?: HuntStatus): Promise<Hunt[]> {
  const rows = await prisma.shinyHunt.findMany({
    where: status ? { userId, status } : { userId },
    orderBy: { updatedAt: "desc" },
    select: huntSelect,
  });
  return rows.map((row) => ({ ...row, species: toSpecies(row.species) }));
}

export async function getHunt(userId: string, huntId: string): Promise<Hunt | null> {
  const row = await prisma.shinyHunt.findFirst({ where: { id: huntId, userId }, select: huntSelect });
  return row && { ...row, species: toSpecies(row.species) };
}

/** Chasses en cours d'une espèce, pour la fiche Pokémon. */
export async function getSpeciesHunts(userId: string, speciesId: number): Promise<Hunt[]> {
  const rows = await prisma.shinyHunt.findMany({
    where: { userId, speciesId, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    select: huntSelect,
  });
  return rows.map((row) => ({ ...row, species: toSpecies(row.species) }));
}

/** Shinies obtenus, les plus récents en premier. */
export async function getShinies(userId: string, speciesId?: number): Promise<Shiny[]> {
  const rows = await prisma.shinyCapture.findMany({
    where: speciesId === undefined ? { userId } : { userId, speciesId },
    orderBy: [{ caughtAt: "desc" }, { id: "desc" }],
    select: shinySelect,
  });
  return rows.map((row) => ({ ...row, species: toSpecies(row.species) }));
}

export async function createHunt(userId: string, data: { speciesId: number; versionId: number; method: string | null; count: number }) {
  return prisma.shinyHunt.create({ data: { userId, ...data }, select: { id: true } });
}

/** Enregistre la valeur du compteur (valeur absolue : le client est la source de vérité). */
export async function setHuntCount(userId: string, huntId: string, count: number) {
  const result = await prisma.shinyHunt.updateMany({ where: { id: huntId, userId, status: "ACTIVE" }, data: { count } });
  return result.count === 1;
}

/** Met en pause (ABANDONED) ou reprend (ACTIVE) une chasse. */
export async function setHuntStatus(userId: string, huntId: string, status: "ACTIVE" | "ABANDONED") {
  const result = await prisma.shinyHunt.updateMany({
    where: { id: huntId, userId, status: status === "ACTIVE" ? "ABANDONED" : "ACTIVE" },
    data: { status },
  });
  return result.count === 1;
}

/**
 * Clôture une chasse : elle devient un shiny de la galerie, avec son compteur comme nombre de rencontres.
 * `count` est la valeur affichée au moment de la clôture (elle peut ne pas être encore sauvegardée).
 */
export async function completeHunt(
  userId: string,
  huntId: string,
  { count, ...data }: { count: number | null; nickname: string | null; note: string | null; caughtAt: Date },
) {
  return prisma.$transaction(async (tx) => {
    const hunt = await tx.shinyHunt.findFirst({ where: { id: huntId, userId, status: "ACTIVE" } });
    if (!hunt) return null;
    const encounters = count ?? hunt.count;
    await tx.shinyHunt.update({ where: { id: hunt.id }, data: { status: "COMPLETED", completedAt: data.caughtAt, count: encounters } });
    return tx.shinyCapture.create({
      data: { userId, speciesId: hunt.speciesId, versionId: hunt.versionId, huntId: hunt.id, encounters, method: hunt.method, ...data },
      select: { id: true },
    });
  });
}

/** Supprime une chasse (et le shiny qui en est issu, le cas échéant). */
export async function deleteHunt(userId: string, huntId: string) {
  return prisma.$transaction(async (tx) => {
    const hunt = await tx.shinyHunt.findFirst({ where: { id: huntId, userId }, select: { id: true } });
    if (!hunt) return false;
    await tx.shinyCapture.deleteMany({ where: { huntId: hunt.id } });
    await tx.shinyHunt.delete({ where: { id: hunt.id } });
    return true;
  });
}

export async function createShiny(
  userId: string,
  data: { speciesId: number; versionId: number; encounters: number | null; method: string | null; nickname: string | null; note: string | null; caughtAt: Date },
) {
  return prisma.shinyCapture.create({ data: { userId, ...data }, select: { id: true } });
}

/** Supprime un shiny de la galerie ; la chasse dont il est issu disparaît avec lui. */
export async function deleteShiny(userId: string, shinyId: string) {
  return prisma.$transaction(async (tx) => {
    const shiny = await tx.shinyCapture.findFirst({ where: { id: shinyId, userId }, select: { id: true, huntId: true } });
    if (!shiny) return false;
    await tx.shinyCapture.delete({ where: { id: shiny.id } });
    if (shiny.huntId) await tx.shinyHunt.delete({ where: { id: shiny.huntId } });
    return true;
  });
}
