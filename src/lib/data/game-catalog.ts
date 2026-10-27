// Habillage des jeux sur l'accueil : la mascotte, Pokémon de la jaquette, en id de forme PokeAPI pour
// prendre la forme propre au jeu (Kyurem Noir pour Noir 2, Primo-Groudon pour Rubis Oméga…).
// PokeAPI n'a pas cette donnée : la liste est tenue à la main, en slugs de version. Un jeu absent s'affiche sans sprite.

export type GameExtra = { mascot: number };
export const GAME_EXTRAS: Record<string, GameExtra> = {
  red: { mascot: 6 },
  blue: { mascot: 9 },
  yellow: { mascot: 25 },
  gold: { mascot: 250 },
  silver: { mascot: 249 },
  crystal: { mascot: 245 },
  ruby: { mascot: 383 },
  sapphire: { mascot: 382 },
  emerald: { mascot: 384 },
  firered: { mascot: 6 },
  leafgreen: { mascot: 3 },
  colosseum: { mascot: 197 },
  xd: { mascot: 249 },
  diamond: { mascot: 483 },
  pearl: { mascot: 484 },
  platinum: { mascot: 10007 }, // Giratina Forme Originelle
  heartgold: { mascot: 250 },
  soulsilver: { mascot: 249 },
  black: { mascot: 643 },
  white: { mascot: 644 },
  "black-2": { mascot: 10022 }, // Kyurem Noir
  "white-2": { mascot: 10023 }, // Kyurem Blanc
  x: { mascot: 716 },
  y: { mascot: 717 },
  "omega-ruby": { mascot: 10078 }, // Primo-Groudon
  "alpha-sapphire": { mascot: 10077 }, // Primo-Kyogre
  sun: { mascot: 791 },
  moon: { mascot: 792 },
  "ultra-sun": { mascot: 10155 }, // Necrozma Crinière du Couchant
  "ultra-moon": { mascot: 10156 }, // Necrozma Ailes de l'Aurore
  "lets-go-pikachu": { mascot: 10158 }, // Pikachu partenaire
  "lets-go-eevee": { mascot: 10159 }, // Évoli partenaire
  sword: { mascot: 888 },
  shield: { mascot: 889 },
  "brilliant-diamond": { mascot: 10245 }, // Dialga Forme Originelle
  "shining-pearl": { mascot: 10246 }, // Palkia Forme Originelle
  "legends-arceus": { mascot: 493 },
  scarlet: { mascot: 1007 },
  violet: { mascot: 1008 },
  "legends-za": { mascot: 718 },
};

/** Le National n'a pas de jaquette : Bulbizarre, n° 001, le représente. */
export const NATIONAL_MASCOT = 1;

/** Sprites de la carte National, du premier starter au Pokémon fabuleux de Kanto. */
export const NATIONAL_PREVIEW = [1, 4, 7, 25, 151];
