/** Chemin du sprite 96×96 d'une forme (téléchargé par `npm run import:data`). */
export function spriteUrl(pokemonId: number, { shiny = false } = {}) {
  return shiny ? `/sprites/pokemon/shiny/${pokemonId}.png` : `/sprites/pokemon/${pokemonId}.png`;
}
