"use server";

import { redirect } from "next/navigation";
import { getVersionBySlug } from "@/lib/data/games";
import { getLearnableMoves } from "@/lib/data/moves";
import { getTeamBuilderData } from "@/lib/data/team";
import { encodeTeamSlots, resolveTeamSlots } from "@/lib/data/team-slots";
import { createTeam, deleteTeam, updateTeam } from "@/lib/data/teams";
import type { LearnableMove } from "@/lib/moves";
import { getCurrentUser } from "@/lib/session";
import { TEAM_NAME_MAX } from "@/lib/team";

/** Capacités offensives d'une forme dans un jeu, pour la fenêtre de choix des attaques de la page Équipe. */
export async function learnableMovesAction(versionSlug: string, pokemonId: number): Promise<LearnableMove[]> {
  if (typeof versionSlug !== "string" || !Number.isInteger(pokemonId)) return [];
  return getLearnableMoves(versionSlug, pokemonId);
}

export type SaveTeamResult = { ok: true; teamId: string; name: string; slots: string } | { ok: false; error: string };

/**
 * Sauvegarde explicite d'une équipe (bouton « Sauvegarder ») : crée l'équipe si `teamId` est `null`, sinon la met
 * à jour. Les emplacements sont revalidés pour le jeu ; le résultat renvoie ce qui a été réellement enregistré.
 */
export async function saveTeamAction(input: { teamId: string | null; versionSlug: string; name: string; slots: string }): Promise<SaveTeamResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Connecte-toi pour sauvegarder tes équipes." };
  const { teamId, versionSlug, slots } = input;
  if ((teamId !== null && typeof teamId !== "string") || typeof versionSlug !== "string" || typeof slots !== "string" || typeof input.name !== "string") {
    return { ok: false, error: "Requête invalide." };
  }
  const name = input.name.trim();
  if (name === "") return { ok: false, error: "Donne un nom à ton équipe." };
  if (name.length > TEAM_NAME_MAX) return { ok: false, error: `Au plus ${TEAM_NAME_MAX} caractères pour le nom.` };

  const [version, data] = await Promise.all([getVersionBySlug(versionSlug), getTeamBuilderData(versionSlug)]);
  if (!version || !data) return { ok: false, error: "Jeu inconnu." };
  const saved = encodeTeamSlots(await resolveTeamSlots(data, slots));

  try {
    if (teamId === null) {
      const team = await createTeam(user.id, { versionId: version.id, name, slots: saved });
      return { ok: true, teamId: team.id, name, slots: saved };
    }
    if (!(await updateTeam(user.id, version.id, teamId, { name, slots: saved }))) return { ok: false, error: "Équipe introuvable." };
    return { ok: true, teamId, name, slots: saved };
  } catch (error) {
    console.error("[équipes]", error);
    return { ok: false, error: "Impossible de sauvegarder pour le moment." };
  }
}

/** Supprime une équipe et revient à la liste des équipes du jeu. */
export async function deleteTeamAction(teamId: string, versionSlug: string): Promise<void> {
  const user = await getCurrentUser();
  const list = `/jeu/${encodeURIComponent(versionSlug)}/equipe`;
  if (!user) redirect(`/connexion?next=${encodeURIComponent(list)}`);
  await deleteTeam(user.id, teamId);
  redirect(list);
}
