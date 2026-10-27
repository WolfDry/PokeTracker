"use client";

import { useEffect } from "react";
import type { Game } from "@/lib/game";
import { useGameStore } from "@/store/game-store";

/** Recopie dans le store le jeu de la page : l'URL reste la source, y compris après un rechargement. */
export function GameSync({ game }: { game: Game }) {
  const hydrated = useGameStore((state) => state.hydrated);
  const setGame = useGameStore((state) => state.setGame);
  // Après la relecture du navigateur seulement : sinon le jeu mémorisé écraserait celui de la page.
  useEffect(() => {
    if (hydrated) setGame(game);
  }, [hydrated, game, setGame]);
  return null;
}
