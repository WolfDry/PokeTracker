// Types et helpers partagés (serveur + client) du tableau des rencontres.
// Les requêtes sont dans src/lib/data/encounters.ts.

/** Méthodes « canne » : un filtre dédié permet de les masquer d'un coup. */
export const ROD_METHOD_SLUGS = new Set(["old-rod", "good-rod", "super-rod", "super-rod-spots", "feebas-tile-fishing"]);

export type EncounterVersion = { id: number; slug: string; nameFr: string };
export type EncounterMethodRef = { id: number; slug: string; nameFr: string; order: number };
export type EncounterConditionRef = { id: number; conditionId: number; nameFr: string; isDefault: boolean };
/** `formNameFr` est `null` pour la forme par défaut, sauf si elle a un vrai nom (Bargantua « Motif Rouge ») : `isDefault` dit alors de ne pas l'afficher seul. */
export type EncounterPokemon = { speciesId: number; nameFr: string; formNameFr: string | null; isDefault: boolean };

/** Taux cumulé (%) et niveaux d'une ligne dans une version. Tuple pour alléger le transfert vers le client. */
export type LevelRate = [rate: number, minLevel: number, maxLevel: number];

export type EncounterRow = {
  pokemonId: number;
  methodId: number;
  /** Ids de `conditions` de la table (toutes requises). */
  conditionIds: number[];
  /** Groupes de valeurs alternatives d'une même condition (« Le matin / La nuit »). */
  alternatives: number[][];
  /** Aligné sur `versions` ; `null` si le Pokémon n'apparaît pas dans cette version. */
  byVersion: (LevelRate | null)[];
};

export type EncounterArea = {
  id: number;
  nameFr: string;
  /** Fréquence globale d'une méthode dans la zone, par version (ex. herbes hautes : 20). */
  rates: { methodId: number; versionId: number; rate: number }[];
  rows: EncounterRow[];
};

export type LocationEncounterTable = {
  versions: EncounterVersion[];
  methods: EncounterMethodRef[];
  conditions: Record<number, EncounterConditionRef>;
  pokemons: Record<number, EncounterPokemon>;
  areas: EncounterArea[];
};

/** "2–3", ou "5" quand min = max. */
export function formatLevels(minLevel: number, maxLevel: number) {
  return minLevel === maxLevel ? String(minLevel) : `${minLevel}–${maxLevel}`;
}

export type ConditionMeta = {
  /** valeur → condition (time-morning → time). */
  conditionOf: Map<number, number>;
  /** Valeurs « par défaut » (radio éteinte, pas d'essaim…), qui décrivent l'état normal du jeu. */
  defaults: Set<number>;
  /** Valeurs de chaque condition rencontrées dans ce lieu. */
  presentValues: Map<number, Set<number>>;
};

/**
 * Fusionne les lignes qui ne diffèrent que par les valeurs d'une même condition, à taux et niveaux égaux.
 * PokeAPI encode par exemple « Chétiflor 20 % le matin », « … la journée », « … la nuit (radio éteinte) » :
 * si toutes les valeurs de la condition présentes dans le lieu sont couvertes, la condition disparaît
 * (Chétiflor 20 %, sans condition) ; sinon elles sont regroupées en alternative (« Le matin / La nuit »).
 * Les valeurs par défaut des autres conditions n'empêchent pas la fusion.
 */
export function collapseConditionRows(rows: EncounterRow[], meta: ConditionMeta): EncounterRow[] {
  const signature = (row: EncounterRow) => `${row.pokemonId}|${row.methodId}|${JSON.stringify(row.byVersion)}`;
  const groups = new Map<string, EncounterRow[]>();
  for (const row of rows) groups.set(signature(row), [...(groups.get(signature(row)) ?? []), row]);

  const result: EncounterRow[] = [];
  for (let group of groups.values()) {
    const conditionIds = new Set(group.flatMap((row) => row.conditionIds.map((id) => meta.conditionOf.get(id)!)));
    for (const conditionId of [...conditionIds].sort((a, b) => a - b)) {
      const partitions = new Map<string, EncounterRow[]>();
      for (const row of group) {
        const rest = row.conditionIds.filter((id) => meta.conditionOf.get(id) !== conditionId);
        const key = `${rest.filter((id) => !meta.defaults.has(id)).join(".")}|${JSON.stringify(row.alternatives)}`;
        partitions.set(key, [...(partitions.get(key) ?? []), row]);
      }
      group = [...partitions.values()].map((partition) => {
        if (partition.length === 1) return partition[0];
        const values = new Set(partition.flatMap((row) => row.conditionIds.filter((id) => meta.conditionOf.get(id) === conditionId)));
        const covered = [...(meta.presentValues.get(conditionId) ?? [])].every((id) => values.has(id));
        // Conditions communes à toutes les lignes fusionnées (hors la condition en cours).
        const common = partition[0].conditionIds.filter(
          (id) => meta.conditionOf.get(id) !== conditionId && partition.every((row) => row.conditionIds.includes(id)),
        );
        const alternatives = covered ? partition[0].alternatives : [...partition[0].alternatives, [...values].sort((a, b) => a - b)];
        return { ...partition[0], conditionIds: common, alternatives };
      });
    }
    result.push(...group);
  }
  return result;
}
