"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/game-store";

/** Relit le jeu mémorisé dans le navigateur, une fois la page hydratée. À monter une seule fois, dans le layout. */
export function GameStoreHydration() {
  useEffect(() => {
    void useGameStore.persist.rehydrate();
  }, []);
  return null;
}
