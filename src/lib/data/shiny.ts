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
const formSelect = { select: { id: true, nameFr: true } } as const;
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
  pokemon: formSelect,
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
  pokemon: formSelect,
  version: { select: versionSelect },
} as const;

type SpeciesRow = { id: number; nameFr: string; pokemons: { id: number }[] };
type FormRow = { id: number; nameFr: string | null } | null;
/** Espèce d'une chasse ou d'un shiny, sous sa forme (sprite et nom « Rattata d'Alola ») ; forme par défaut si aucune. */
const toSpecies = (s: SpeciesRow, form: FormRow): ShinySpecies => ({
  id: s.id,
  nameFr: form?.nameFr ?? s.nameFr,
  pokemonId: form?.id ?? s.pokemons[0]?.id ?? s.id,
});

/** Chasses de l'utilisateur, les plus récemment touchées en premier. */
export async function getHunts(userId: string, status?: HuntStatus): Promise<Hunt[]> {
  const rows = await prisma.shinyHunt.findMany({
    where: status ? { userId, status } : { userId },
    orderBy: { updatedAt: "desc" },
    select: huntSelect,
  });
  return rows.map((row) => ({ ...row, species: toSpecies(row.species, row.pokemon) }));
}

export async function getHunt(userId: string, huntId: string): Promise<Hunt | null> {
  const row = await prisma.shinyHunt.findFirst({ where: { id: huntId, userId }, select: huntSelect });
  return row && { ...row, species: toSpecies(row.species, row.pokemon) };
}

/** Chasses en cours d'une espèce, pour la fiche Pokémon. */
export async function getSpeciesHunts(userId: string, speciesId: number): Promise<Hunt[]> {
  const rows = await prisma.shinyHunt.findMany({
    where: { userId, speciesId, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    select: huntSelect,
  });
  return rows.map((row) => ({ ...row, species: toSpecies(row.species, row.pokemon) }));
}

/** Shinies obtenus, les plus récents en premier. */
export async function getShinies(userId: string, speciesId?: number): Promise<Shiny[]> {
  const rows = await prisma.shinyCapture.findMany({
    where: speciesId === undefined ? { userId } : { userId, speciesId },
    orderBy: [{ caughtAt: "desc" }, { id: "desc" }],
    select: shinySelect,
  });
  return rows.map((row) => ({ ...row, species: toSpecies(row.species, row.pokemon) }));
}

/** Chasses en cours dans un jeu, les plus récemment touchées en premier. */
export async function getGameHunts(userId: string, versionId: number): Promise<Hunt[]> {
  const rows = await prisma.shinyHunt.findMany({ where: { userId, versionId, status: "ACTIVE" }, orderBy: { updatedAt: "desc" }, select: huntSelect });
  return rows.map((row) => ({ ...row, species: toSpecies(row.species, row.pokemon) }));
}

/** État d'une espèce dans le shiny dex d'un jeu. */
export type ShinyDexMeta = {
  /** Shinies obtenus dans ce jeu. */
  count: number;
  /** Au moins un shiny issu d'une chasse ou renseigné : on confirme avant de le supprimer en décochant. */
  detailed: boolean;
  /** Chasse en cours sur l'espèce dans ce jeu. */
  hunt: { id: string; count: number } | null;
};

/** Shiny dex d'un jeu : espèces obtenues, et pour chaque espèce concernée ses shinies et sa chasse en cours. */
export async function getShinyDex(userId: string, versionId: number): Promise<{ speciesIds: number[]; meta: Record<number, ShinyDexMeta> }> {
  const [shinies, hunts] = await Promise.all([
    prisma.shinyCapture.findMany({
      where: { userId, versionId },
      select: { speciesId: true, huntId: true, encounters: true, method: true, nickname: true, note: true },
    }),
    prisma.shinyHunt.findMany({ where: { userId, versionId, status: "ACTIVE" }, orderBy: { updatedAt: "desc" }, select: { id: true, speciesId: true, count: true } }),
  ]);
  const meta: Record<number, ShinyDexMeta> = {};
  const entry = (speciesId: number) => (meta[speciesId] ??= { count: 0, detailed: false, hunt: null });
  for (const shiny of shinies) {
    const m = entry(shiny.speciesId);
    m.count += 1;
    m.detailed ||= Boolean(shiny.huntId || shiny.encounters !== null || shiny.method || shiny.nickname || shiny.note);
  }
  // La chasse la plus récente si plusieurs sont menées sur la même espèce.
  for (const hunt of hunts) entry(hunt.speciesId).hunt ??= { id: hunt.id, count: hunt.count };
  return { speciesIds: [...new Set(shinies.map((s) => s.speciesId))], meta };
}

/** Shiny dex National : espèces obtenues dans au moins un jeu, et les jeux où chacune l'est (dans l'ordre des jeux). */
export async function getNationalShinies(userId: string): Promise<{ speciesIds: number[]; caughtIn: Record<number, string[]> }> {
  const rows = await prisma.shinyCapture.findMany({
    where: { userId },
    orderBy: { versionId: "asc" },
    select: { speciesId: true, version: { select: { nameFr: true } } },
  });
  const caughtIn: Record<number, string[]> = {};
  for (const row of rows) {
    const games = (caughtIn[row.speciesId] ??= []);
    if (!games.includes(row.version.nameFr)) games.push(row.version.nameFr);
  }
  return { speciesIds: Object.keys(caughtIn).map(Number), caughtIn };
}

/**
 * Coche ou décoche une espèce dans le shiny dex d'un jeu. Cocher ajoute un shiny sans détails s'il n'y en a
 * pas déjà un ; décocher supprime tous les shinies de l'espèce dans ce jeu, et les chasses dont ils sont issus.
 */
export async function setShinyObtained(userId: string, versionId: number, speciesId: number, obtained: boolean, pokemonId: number | null = null) {
  await prisma.$transaction(async (tx) => {
    const shinies = await tx.shinyCapture.findMany({ where: { userId, versionId, speciesId }, select: { id: true, huntId: true } });
    if (obtained) {
      // La forme affichée dans le dex du jeu (Rattata d'Alola dans le Pokédex d'Alola).
      if (shinies.length === 0) await tx.shinyCapture.create({ data: { userId, versionId, speciesId, pokemonId } });
      return;
    }
    await tx.shinyCapture.deleteMany({ where: { id: { in: shinies.map((s) => s.id) } } });
    const huntIds = shinies.flatMap((s) => (s.huntId ? [s.huntId] : []));
    if (huntIds.length > 0) await tx.shinyHunt.deleteMany({ where: { id: { in: huntIds }, userId } });
  });
}

export async function createHunt(userId: string, data: { speciesId: number; pokemonId: number | null; versionId: number; method: string | null; count: number }) {
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
      data: { userId, speciesId: hunt.speciesId, pokemonId: hunt.pokemonId, versionId: hunt.versionId, huntId: hunt.id, encounters, method: hunt.method, ...data },
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
  data: { speciesId: number; pokemonId: number | null; versionId: number; encounters: number | null; method: string | null; nickname: string | null; note: string | null; caughtAt: Date },
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
