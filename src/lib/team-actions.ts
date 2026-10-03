"use server";

import { getLearnableMoves } from "@/lib/data/moves";
import type { LearnableMove } from "@/lib/moves";

/** Capacités offensives d'une forme dans un jeu, pour la fenêtre de choix des attaques de la page Équipe. */
export async function learnableMovesAction(versionSlug: string, pokemonId: number): Promise<LearnableMove[]> {
  if (typeof versionSlug !== "string" || !Number.isInteger(pokemonId)) return [];
  return getLearnableMoves(versionSlug, pokemonId);
}
