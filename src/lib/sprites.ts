/** Chemin de l'image 256×256 d'une forme (rendu Pokémon HOME ou illustration officielle, téléchargée par `npm run import:data`). */
export function spriteUrl(pokemonId: number, { shiny = false } = {}) {
  return shiny ? `/sprites/pokemon/shiny/${pokemonId}.webp` : `/sprites/pokemon/${pokemonId}.webp`;
}
