/**
 * Chemin de l'image 256×256 d'une forme (rendu Pokémon HOME ou illustration officielle, téléchargée par
 * `npm run import:data`). Avec `form`, celle d'une variante d'apparence (« vivillon-icy-snow »).
 */
export function spriteUrl(pokemonId: number, { shiny = false, form }: { shiny?: boolean; form?: string | null } = {}) {
  const dir = form ? "/sprites/pokemon/forms" : "/sprites/pokemon";
  return `${dir}${shiny ? "/shiny" : ""}/${form ?? pokemonId}.webp`;
}
