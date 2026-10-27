import type { CSSProperties } from "react";

// Habillage des jeux sur l'accueil : la mascotte, Pokémon de la jaquette, en id de forme PokeAPI pour
// prendre la forme propre au jeu (Kyurem Noir pour Noir 2, Primo-Groudon pour Rubis Oméga…).
// Et sa teinte (`hue`, `chroma` oklch), qui colore l'écran de la mascotte et l'action « Continuer » (`.game-tint`).
// PokeAPI n'a pas ces données : la liste est tenue à la main, en slugs de version. Un jeu absent s'affiche sans sprite, en neutre.

export type GameTint = { hue: number; chroma: number };

/** Variables d'un élément `.game-tint`. Sans teinte, neutre explicite : il n'hérite pas de celle d'un parent. */
export function gameTintStyle(tint: GameTint | null | undefined) {
  return { "--game-h": tint?.hue ?? 85, "--game-c": tint?.chroma ?? 0 } as CSSProperties;
}
export type GameExtra = GameTint & { mascot: number };
export const GAME_EXTRAS: Record<string, GameExtra> = {
  red: { mascot: 6, hue: 27, chroma: 0.17 },
  blue: { mascot: 9, hue: 255, chroma: 0.13 },
  yellow: { mascot: 25, hue: 95, chroma: 0.13 },
  gold: { mascot: 250, hue: 80, chroma: 0.12 },
  silver: { mascot: 249, hue: 250, chroma: 0.03 },
  crystal: { mascot: 245, hue: 215, chroma: 0.09 },
  ruby: { mascot: 383, hue: 20, chroma: 0.17 },
  sapphire: { mascot: 382, hue: 255, chroma: 0.14 },
  emerald: { mascot: 384, hue: 160, chroma: 0.13 },
  firered: { mascot: 6, hue: 40, chroma: 0.17 },
  leafgreen: { mascot: 3, hue: 140, chroma: 0.13 },
  colosseum: { mascot: 197, hue: 60, chroma: 0.04 },
  xd: { mascot: 249, hue: 290, chroma: 0.08 },
  diamond: { mascot: 483, hue: 240, chroma: 0.09 },
  pearl: { mascot: 484, hue: 350, chroma: 0.09 },
  platinum: { mascot: 10007, hue: 75, chroma: 0.04 }, // Giratina Forme Originelle
  heartgold: { mascot: 250, hue: 80, chroma: 0.12 },
  soulsilver: { mascot: 249, hue: 250, chroma: 0.03 },
  black: { mascot: 643, hue: 270, chroma: 0.015 },
  white: { mascot: 644, hue: 90, chroma: 0.015 },
  "black-2": { mascot: 10022, hue: 250, chroma: 0.04 }, // Kyurem Noir
  "white-2": { mascot: 10023, hue: 210, chroma: 0.04 }, // Kyurem Blanc
  x: { mascot: 716, hue: 245, chroma: 0.13 },
  y: { mascot: 717, hue: 20, chroma: 0.17 },
  "omega-ruby": { mascot: 10078, hue: 25, chroma: 0.17 }, // Primo-Groudon
  "alpha-sapphire": { mascot: 10077, hue: 250, chroma: 0.13 }, // Primo-Kyogre
  sun: { mascot: 791, hue: 55, chroma: 0.15 },
  moon: { mascot: 792, hue: 290, chroma: 0.12 },
  "ultra-sun": { mascot: 10155, hue: 50, chroma: 0.16 }, // Necrozma Crinière du Couchant
  "ultra-moon": { mascot: 10156, hue: 285, chroma: 0.12 }, // Necrozma Ailes de l'Aurore
  "lets-go-pikachu": { mascot: 10158, hue: 95, chroma: 0.13 }, // Pikachu partenaire
  "lets-go-eevee": { mascot: 10159, hue: 60, chroma: 0.11 }, // Évoli partenaire
  sword: { mascot: 888, hue: 230, chroma: 0.12 },
  shield: { mascot: 889, hue: 0, chroma: 0.14 },
  "brilliant-diamond": { mascot: 10245, hue: 240, chroma: 0.09 }, // Dialga Forme Originelle
  "shining-pearl": { mascot: 10246, hue: 350, chroma: 0.1 }, // Palkia Forme Originelle
  "legends-arceus": { mascot: 493, hue: 180, chroma: 0.06 },
  scarlet: { mascot: 1007, hue: 35, chroma: 0.17 },
  violet: { mascot: 1008, hue: 305, chroma: 0.15 },
  "legends-za": { mascot: 718, hue: 150, chroma: 0.12 },
};

/** Le National n'a pas de jaquette : Bulbizarre, n° 001, le représente. */
export const NATIONAL_MASCOT = 1;
/** Le National prend le rouge de la coque : c'est le Pokédex tout court. */
export const NATIONAL_TINT: GameTint = { hue: 27, chroma: 0.17 };

/** Sprites de la carte National, du premier starter au Pokémon fabuleux de Kanto. */
export const NATIONAL_PREVIEW = [1, 4, 7, 25, 151];
