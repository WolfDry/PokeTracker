"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { NATIONAL_SLUG } from "@/lib/game";
import { newHuntHref } from "@/lib/shiny";
import { useGameStore } from "@/store/game-store";

/**
 * Lien « Lancer une chasse » d'une page qui ne dépend pas d'un jeu (fiche Pokémon) : la chasse se lance
 * dans le jeu en cours, ou au National (choix du jeu dans le formulaire) si aucun n'est choisi.
 */
export function NewHuntLink({ speciesId, className, children }: { speciesId: number; className?: string; children: ReactNode }) {
  const game = useGameStore((state) => state.game);
  return (
    <Link href={newHuntHref(game?.slug ?? NATIONAL_SLUG, { speciesId })} className={className}>
      {children}
    </Link>
  );
}
