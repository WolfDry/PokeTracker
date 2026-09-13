// Qualité des données de rencontre PokeAPI par jeu, constatée en sept. 2026.
// Un jeu absent de ces listes est NONE s'il n'a aucune rencontre, PARTIAL sinon
// (prudence par défaut pour un jeu qu'on n'a pas vérifié).

export type Coverage = "FULL" | "PARTIAL" | "NONE";

const FULL = new Set([
  "red", "blue", "yellow", "red-japan", "green-japan",
  "gold", "silver", "crystal",
  "ruby", "sapphire", "emerald", "firered", "leafgreen",
  "diamond", "pearl", "platinum", "heartgold", "soulsilver",
  "black", "white", "black-2", "white-2",
  "lets-go-pikachu", "lets-go-eevee",
  "sword", "shield",
  "the-isle-of-armor-sword", "the-isle-of-armor-shield",
  "the-crown-tundra-sword", "the-crown-tundra-shield",
]);

const PARTIAL: Record<string, string> = {
  "blue-japan": "Quelques rencontres seulement.",
  colosseum: "Pokémon à capturer (snag) uniquement.",
  xd: "Pokémon à capturer (snag) et Poké Spots uniquement.",
  x: "Données partielles dans PokeAPI.",
  y: "Données partielles dans PokeAPI.",
  "omega-ruby": "Données très partielles dans PokeAPI.",
  "alpha-sapphire": "Données très partielles dans PokeAPI.",
  sun: "Données partielles dans PokeAPI.",
  moon: "Données partielles dans PokeAPI.",
  "ultra-sun": "Données partielles dans PokeAPI.",
  "ultra-moon": "Données partielles dans PokeAPI.",
};

const NONE_NOTE = "PokeAPI ne fournit pas encore les lieux de rencontre de ce jeu.";

export function coverageFor(
  versionSlug: string,
  encounterCount: number,
): { status: Coverage; note: string | null } {
  if (encounterCount === 0) return { status: "NONE", note: NONE_NOTE };
  if (FULL.has(versionSlug)) return { status: "FULL", note: null };
  return { status: "PARTIAL", note: PARTIAL[versionSlug] ?? "Couverture non vérifiée." };
}
