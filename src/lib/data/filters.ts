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
