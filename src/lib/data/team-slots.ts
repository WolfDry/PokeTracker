import "server-only";

import type { TeamSlot } from "@/components/team-builder";
import { getLearnableMoves } from "@/lib/data/moves";
import type { TeamBuilderData } from "@/lib/data/team";
import { toTeamMove } from "@/lib/moves";
import { decodeTeam, encodeTeam } from "@/lib/team";

/**
 * Emplacements d'une équipe (« 6.53.394-0-25 », URL ou sauvegarde) valables dans un jeu : un Pokémon absent
 * du jeu laisse son emplacement vide, une capacité qu'il ne peut pas apprendre dans ce jeu est ignorée.
 */
export async function resolveTeamSlots(data: TeamBuilderData, value: string | string[] | undefined): Promise<TeamSlot[]> {
  const slots = decodeTeam(value, new Set(data.options.map((o) => o.pokemonId)));
  return Promise.all(
    slots.map(async (slot) => {
      if (!slot) return null;
      const learnable = new Map((await getLearnableMoves(data.game.slug, slot.pokemonId)).map((m) => [m.id, m]));
      const moves = slot.moveIds.flatMap((id) => {
        const move = learnable.get(id);
        return move ? [toTeamMove(move)] : [];
      });
      return { pokemonId: slot.pokemonId, moves };
    }),
  );
}

/** Équipe → format compact, tel qu'il est sauvegardé et mis dans l'URL. */
export function encodeTeamSlots(team: TeamSlot[]) {
  return encodeTeam(team.map((slot) => slot && { pokemonId: slot.pokemonId, moveIds: slot.moves.map((m) => m.id) }));
}
