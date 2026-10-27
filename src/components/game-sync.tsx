"use client";

import { useEffect } from "react";
import type { Game } from "@/lib/game";
import { useGameStore } from "@/store/game-store";

/** Recopie dans le store le jeu de la page : l'URL reste la source, y compris après un rechargement. */
export function GameSync({ game }: { game: Game }) {
  const setGame = useGameStore((state) => state.setGame);
  useEffect(() => setGame(game), [game, setGame]);
  return null;
}
