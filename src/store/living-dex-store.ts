import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Vues du living dex : tout le Pokédex en mosaïque (par défaut), rangé en boîtes de 30, ou lieu par lieu. */
export type LivingDexView = "mosaique" | "boites" | "itineraire";

type LivingDexStore = {
  view: LivingDexView;
  setView: (view: LivingDexView) => void;
};

// Même schéma que les autres stores : mémorisé dans le navigateur, relu après l'hydratation (`skipHydration`)
// par <GameStoreHydration />. Le premier rendu montre donc toujours la mosaïque, puis la vue retenue.
export const useLivingDexStore = create<LivingDexStore>()(
  persist(
    (set) => ({
      view: "mosaique",
      setView: (view) => set({ view }),
    }),
    {
      name: "poketracker:living-dex",
      version: 1,
      skipHydration: true,
      partialize: (state) => ({ view: state.view }),
    },
  ),
);
