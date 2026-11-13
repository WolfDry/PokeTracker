// Constantes des shasses shiny partagées entre le serveur et le client.

export const MAX_HUNT_COUNT = 1_000_000;

/** Page d'une shasse, dans l'onglet Shiny dex de son jeu. */
export const huntHref = (versionSlug: string, huntId: string) => `/jeu/${versionSlug}/shiny/shasse/${huntId}`;

/** Formulaire de nouvelle shasse d'un jeu (ou du National, avec choix du jeu), espèce et forme présélectionnables. */
export function newHuntHref(gameSlug: string, preset?: { speciesId: number; pokemonId?: number }) {
  const query = preset ? `?espece=${preset.speciesId}${preset.pokemonId ? `&forme=${preset.pokemonId}` : ""}` : "";
  return `/jeu/${gameSlug}/shiny/nouvelle${query}`;
}

/** Suggestions pour le champ « Méthode » (texte libre). */
export const HUNT_METHODS = [
  "Full odds",
  "Masuda",
  "Soft reset",
  "Chaîne (Poké Radar)",
  "Chaîne SOS",
  "Chaîne DexNav",
  "Chaîne de captures",
  "Éclosions",
  "Raids",
  "Combat en masse",
  "Sandwich",
  "Safari des Amis",
  "Charme Chroma",
];
