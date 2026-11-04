import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Vues du living dex : tout le Pokédex en mosaïque (par défaut), rangé en boîtes de 30, ou lieu par lieu. */
export type LivingDexView = "mosaique" | "boites" | "itineraire";

/** Pages qui ont des vues, chacune avec la sienne : le living dex et le shiny dex (sans itinéraire). */
export type DexPage = "captures" | "shiny";

type LivingDexStore = {
  views: Record<DexPage, LivingDexView>;
  setView: (page: DexPage, view: LivingDexView) => void;
};

// Même schéma que les autres stores : mémorisé dans le navigateur, relu après l'hydratation (`skipHydration`)
// par <GameStoreHydration />. Le premier rendu montre donc toujours la mosaïque, puis la vue retenue.
export const useLivingDexStore = create<LivingDexStore>()(
  persist(
    (set) => ({
      views: { captures: "mosaique", shiny: "mosaique" },
      setView: (page, view) => set((state) => ({ views: { ...state.views, [page]: view } })),
    }),
    {
      name: "poketracker:living-dex",
      version: 2,
      skipHydration: true,
      partialize: (state) => ({ views: state.views }),
      // v1 : une seule vue, celle du living dex.
      migrate: (persisted, version) => {
        if (version < 2) {
          const view = (persisted as { view?: LivingDexView } | null)?.view ?? "mosaique";
          return { views: { captures: view, shiny: "mosaique" } };
        }
        return persisted as Pick<LivingDexStore, "views">;
      },
    },
  ),
);
