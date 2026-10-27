import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Game } from "@/lib/game";

type GameStore = {
  /** Jeu en cours, posé par la page du jeu ; `null` tant qu'aucun n'est choisi. */
  game: Game | null;
  /** Vrai une fois le jeu relu depuis le navigateur : avant, `game` vaut toujours `null`. */
  hydrated: boolean;
  setGame: (game: Game) => void;
};

// Store côté client uniquement : il n'est jamais écrit pendant le rendu serveur,
// donc pas de fuite d'un visiteur à l'autre via l'instance du module.
// Le jeu est mémorisé dans le navigateur pour le retrouver à la visite suivante ; la relecture
// est différée (`skipHydration`) pour que le premier rendu client égale celui du serveur.
export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      game: null,
      hydrated: false,
      setGame: (game) => set({ game }),
    }),
    {
      name: "poketracker:jeu",
      version: 1,
      skipHydration: true,
      partialize: (state) => ({ game: state.game }),
      onRehydrateStorage: () => () => useGameStore.setState({ hydrated: true }),
    },
  ),
);
