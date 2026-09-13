/**
 * Versions masquées dans l'app : les originaux japonais (Rouge/Vert/Bleu 1996)
 * doublonnent les versions occidentales et n'intéressent pas un joueur francophone.
 */
export function isHiddenVersion(slug: string) {
  return slug.endsWith("-japan");
}

/** "pikachu-starter" → "Pikachu starter", pour les libellés sans traduction. */
export function humanizeSlug(slug: string) {
  const text = slug.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Préfixe des lieux fictifs de PokeAPI (« Inconnu ; que des Rattata ») : tables de rencontre orphelines. */
export const HIDDEN_LOCATION_PREFIX = "unknown-all-";

export function isHiddenLocation(slug: string) {
  return slug.startsWith(HIDDEN_LOCATION_PREFIX);
}

/**
 * « Versions » DLC de PokeAPI (Isolarmure, Couronneige, Masque Turquoise, Disque Indigo, Méga-Dimension) :
 * elles portent les rencontres des extensions, mais pour le joueur c'est le même jeu.
 * Le suivi des captures les rattache donc au jeu de base.
 */
export const DLC_BASE_VERSION: Record<string, string> = {
  "the-isle-of-armor-sword": "sword",
  "the-isle-of-armor-shield": "shield",
  "the-crown-tundra-sword": "sword",
  "the-crown-tundra-shield": "shield",
  "the-teal-mask-scarlet": "scarlet",
  "the-teal-mask-violet": "violet",
  "the-indigo-disk-scarlet": "scarlet",
  "the-indigo-disk-violet": "violet",
  "mega-dimension": "legends-za",
};

export function isDlcVersion(slug: string) {
  return slug in DLC_BASE_VERSION;
}

/** Slugs des versions DLC d'un jeu de base (« sword » → Isolarmure et Couronneige côté Épée). */
export function dlcVersionSlugs(baseSlug: string) {
  return Object.entries(DLC_BASE_VERSION)
    .filter(([, base]) => base === baseSlug)
    .map(([slug]) => slug);
}
