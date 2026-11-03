import { create } from "zustand";
import { persist } from "zustand/middleware";

type SpoilerStore = {
  /** Shinies pas encore obtenus montrés en shiny ; sinon en sprite normal (mode spoiler, par défaut). */
  shinyRevealed: boolean;
  toggleShinyRevealed: () => void;
};

// Même schéma que le store du jeu : mémorisé dans le navigateur, relu après l'hydratation (`skipHydration`)
// par <GameStoreHydration />. Le premier rendu est donc toujours masqué : à la relecture, on ne peut passer
// que du sprite normal au shiny, jamais dévoiler un shiny puis le cacher.
export const useSpoilerStore = create<SpoilerStore>()(
  persist(
    (set) => ({
      shinyRevealed: false,
      toggleShinyRevealed: () => set((state) => ({ shinyRevealed: !state.shinyRevealed })),
    }),
    {
      name: "poketracker:spoilers",
      version: 1,
      skipHydration: true,
      partialize: (state) => ({ shinyRevealed: state.shinyRevealed }),
    },
  ),
);
