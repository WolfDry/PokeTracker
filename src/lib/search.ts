// Recherche en mémoire, insensible aux accents et à la casse, avec classement.
// L'index (≈ 2 200 libellés) est fourni par `getSearchIndex()` (src/lib/data/search.ts).

/** "Létho-Lapin ! (M. Mime)" → "letho lapin m mime" */
export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Score d'un libellé pour une requête, 0 si pas de correspondance.
 * exact > préfixe du libellé > préfixe d'un mot > tous les mots de la requête présents.
 */
export function score(label: string, query: string) {
  const name = normalize(label);
  // Un libellé purement numérique (n° de Pokédex) ne se cherche qu'en exact.
  if (/^\d+$/.test(name)) return name === query ? 100 : 0;
  if (name === query) return 100;
  if (name.startsWith(query)) return 80;
  if (name.split(" ").some((word) => word.startsWith(query))) return 60;
  const tokens = query.split(" ");
  if (tokens.every((token) => name.includes(token))) return 40;
  return 0;
}

export type Scored<T> = T & { score: number };

/**
 * Classe et filtre une liste : score maximal parmi les libellés de chaque élément.
 * Le premier libellé (nom français) l'emporte à score égal sur les suivants (anglais, numéro).
 */
export function rank<T>(items: T[], query: string, labels: (item: T) => string[], limit: number): { results: Scored<T>[]; total: number } {
  const scored: Scored<T>[] = [];
  for (const item of items) {
    const best = Math.max(
      ...labels(item).map((label, index) => {
        const value = score(label, query);
        return value > 0 && index > 0 ? value - 5 : value;
      }),
    );
    if (best > 0) scored.push({ ...item, score: best });
  }
  scored.sort((a, b) => b.score - a.score);
  return { results: scored.slice(0, limit), total: scored.length };
}
