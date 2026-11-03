"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/game-store";
import { useSpoilerStore } from "@/store/spoiler-store";

/** Relit les stores mémorisés dans le navigateur (jeu, spoilers), une fois la page hydratée. À monter une seule fois, dans le layout. */
export function GameStoreHydration() {
  useEffect(() => {
    void useGameStore.persist.rehydrate();
    void useSpoilerStore.persist.rehydrate();
  }, []);
  return null;
}
