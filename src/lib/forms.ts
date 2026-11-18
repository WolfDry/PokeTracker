// Formes à attraper : partagé entre les données (src/lib/data/forms.ts) et la Server Action qui les coche.

/** Forme non par défaut qu'on peut attraper et cocher, en plus de l'espèce. */
export type CapturableForm = {
  /** « p10091 » : une forme `Pokemon` (Rattata d'Alola) ; « f10086 » : une variante `CosmeticForm` (Prismillon Blizzard). */
  key: string;
  speciesId: number;
  /** Forme `Pokemon` (celle de rattachement pour une variante) : sprite de repli. */
  pokemonId: number;
  /** Variante d'apparence : nom de son image. */
  spriteForm: string | null;
  /** « Rattata d'Alola », « Prismillon Blizzard ». */
  nameFr: string;
  /** Rang du groupe de versions où la forme apparaît (0 = depuis toujours) : comparé à `getVersionFormOrders`. */
  introducedOrder: number;
};

/**
 * Formes qui ne se capturent pas, à part celles de combat (Méga, Gigamax, Primo…, `isBattleOnly` chez PokeAPI) :
 * Pokémon Dominants, Éthernatos Infinimax, noyaux de Météno (le Pokémon se capture en forme Météore), et modes de
 * déplacement de Koraidon / Miraidon. Les formes qu'on change sur un même individu (Motisma, Deoxys, Arceus…)
 * comptent : choix de l'utilisateur, comme un « form dex » complet.
 */
const NOT_CAPTURABLE = [/-totem(-|$)/, /^eternatus-eternamax$/, /^minior-(red|orange|yellow|green|blue|indigo|violet)$/, /^(koraidon|miraidon)-/];

export function isCapturableForm(slug: string, isBattleOnly: boolean) {
  return !isBattleOnly && !NOT_CAPTURABLE.some((pattern) => pattern.test(slug));
}

/** Formes déjà sorties dans un jeu (`maxOrder` : rang de son groupe de versions, extensions comprises). */
export function formsInGame(forms: CapturableForm[] | undefined, maxOrder: number | undefined): CapturableForm[] {
  if (!forms || maxOrder === undefined) return [];
  return forms.filter((form) => form.introducedOrder <= maxOrder);
}
