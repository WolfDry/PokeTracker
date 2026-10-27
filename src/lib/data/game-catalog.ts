// Habillage des jeux sur l'accueil : la mascotte (Pokémon de la jaquette, id de forme PokeAPI) et une note
// qui situe le jeu dans la série (« Jumeau de Bleu », « Remake d'Or »). PokeAPI n'a ni l'un ni l'autre :
// la liste est tenue à la main, en slugs de version. Un jeu absent s'affiche sans sprite ni note.

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
  platinum: { mascot: 487 },
  heartgold: { mascot: 250 },
  soulsilver: { mascot: 249 },
  black: { mascot: 643 },
  white: { mascot: 644 },
  "black-2": { mascot: 646 },
  "white-2": { mascot: 646 },
  x: { mascot: 716 },
  y: { mascot: 717 },
  "omega-ruby": { mascot: 383 },
  "alpha-sapphire": { mascot: 382 },
  sun: { mascot: 791 },
  moon: { mascot: 792 },
  "ultra-sun": { mascot: 800 },
  "ultra-moon": { mascot: 800 },
  "lets-go-pikachu": { mascot: 25 },
  "lets-go-eevee": { mascot: 133 },
  sword: { mascot: 888 },
  shield: { mascot: 889 },
  "brilliant-diamond": { mascot: 483 },
  "shining-pearl": { mascot: 484 },
  "legends-arceus": { mascot: 493 },
  scarlet: { mascot: 1007 },
  violet: { mascot: 1008 },
  "legends-za": { mascot: 718 },
};

/** Le National n'a pas de jaquette : Bulbizarre, n° 001, le représente. */
export const NATIONAL_MASCOT = 1;

/** Sprites de la carte National, du premier starter au Pokémon fabuleux de Kanto. */
export const NATIONAL_PREVIEW = [1, 4, 7, 25, 151];
