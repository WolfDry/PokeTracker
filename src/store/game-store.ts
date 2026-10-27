import { create } from "zustand";
import type { Game } from "@/lib/game";

type GameStore = {
  /** Jeu en cours, posé par la page du jeu ; `null` tant qu'aucun n'est choisi. */
  game: Game | null;
  setGame: (game: Game) => void;
};

// Store côté client uniquement : il n'est jamais écrit pendant le rendu serveur,
// donc pas de fuite d'un visiteur à l'autre via l'instance du module.
export const useGameStore = create<GameStore>()((set) => ({
  game: null,
  setGame: (game) => set({ game }),
}));
