import "server-only";

import { prisma } from "@/lib/prisma";

// Équipes sauvegardées d'un utilisateur : données personnelles, lues à la requête — jamais en `use cache`.
// Toujours appelé avec l'id de l'utilisateur connecté ; chaque lecture et écriture filtre sur `userId`.

export type SavedTeam = { id: string; name: string; slots: string; updatedAt: Date };

const teamSelect = { id: true, name: true, slots: true, updatedAt: true } as const;

/** Équipes d'un jeu, la dernière modifiée en premier. */
export async function getTeams(userId: string, versionId: number): Promise<SavedTeam[]> {
  return prisma.team.findMany({ where: { userId, versionId }, orderBy: { updatedAt: "desc" }, select: teamSelect });
}

/** Une équipe d'un jeu (null si elle n'existe pas, appartient à un autre ou à un autre jeu). */
export async function getTeam(userId: string, versionId: number, teamId: string): Promise<SavedTeam | null> {
  return prisma.team.findFirst({ where: { id: teamId, userId, versionId }, select: teamSelect });
}

export async function createTeam(userId: string, data: { versionId: number; name: string; slots: string }) {
  return prisma.team.create({ data: { userId, ...data }, select: { id: true } });
}

/** Met à jour le nom et les emplacements ; faux si l'équipe n'est pas à l'utilisateur ou pas dans ce jeu. */
export async function updateTeam(userId: string, versionId: number, teamId: string, data: { name: string; slots: string }) {
  const result = await prisma.team.updateMany({ where: { id: teamId, userId, versionId }, data });
  return result.count === 1;
}

export async function deleteTeam(userId: string, teamId: string) {
  const result = await prisma.team.deleteMany({ where: { id: teamId, userId } });
  return result.count === 1;
}
