import type { TeamBuilderData, TeamOption, TypeRef } from "@/lib/data/team";

// Analyse des types d'une équipe. Talents (Lévitation, Absorb Eau…) et capacités ne sont pas
// pris en compte : seuls les types des Pokémon comptent, et en attaque leurs types propres (STAB).

export const TEAM_SIZE = 6;

type Chart = Pick<TeamBuilderData, "types" | "chart">;

/** Multiplicateur d'une attaque du type `attack` sur un Pokémon de types `defender` (×4, ×2, ×1, ×½, ×¼ ou 0). */
export function multiplier({ types, chart }: Chart, attack: string, defender: TypeRef[]) {
  const a = types.findIndex((t) => t.slug === attack);
  return defender.reduce((product, type) => {
    const d = types.findIndex((t) => t.slug === type.slug);
    return a < 0 || d < 0 ? product : product * chart[a][d];
  }, 1);
}

export type DefenseRow = {
  type: TypeRef;
  /** Multiplicateur subi par chaque emplacement, `null` pour un emplacement vide. */
  factors: (number | null)[];
  weak: number;
  /** Résistances et immunités. */
  resist: number;
};

/** Pour chaque type d'attaque : ce que subit chaque membre, le nombre de membres faibles et résistants. */
export function analyzeDefense(data: Chart, team: (TeamOption | null)[]): DefenseRow[] {
  return data.types.map((type) => {
    const factors = team.map((member) => (member ? multiplier(data, type.slug, member.types) : null));
    return {
      type,
      factors,
      weak: factors.filter((f) => f !== null && f > 1).length,
      resist: factors.filter((f) => f !== null && f < 1).length,
    };
  });
}

/** Points faibles : plus de membres faibles que de membres qui résistent, les pires en premier. */
export function teamWeaknesses(rows: DefenseRow[]) {
  return rows.filter((r) => r.weak > r.resist).sort((a, b) => b.weak - b.resist - (a.weak - a.resist) || b.weak - a.weak);
}

export type OffenseRow = {
  type: TypeRef;
  /** Membres qui touchent ce type en super efficace avec une attaque de leur type, et le type d'attaque utilisé. */
  hitters: { slot: number; member: TeamOption; attack: TypeRef }[];
};

/** Pour chaque type en défense : les membres qui le touchent en super efficace avec l'un de leurs types. */
export function analyzeOffense(data: Chart, team: (TeamOption | null)[]): OffenseRow[] {
  return data.types.map((type) => ({
    type,
    hitters: team.flatMap((member, slot) => {
      if (!member) return [];
      const best = member.types
        .map((attack) => ({ attack, factor: multiplier(data, attack.slug, [type]) }))
        .sort((a, b) => b.factor - a.factor)[0];
      return best && best.factor > 1 ? [{ slot, member, attack: best.attack }] : [];
    }),
  }));
}

/** Faiblesses non compensées : pour chaque type d'attaque, les membres faibles en trop par rapport à ceux qui résistent. */
function weaknessPressure(rows: DefenseRow[]) {
  return rows.reduce((sum, r) => sum + Math.max(0, r.weak - r.resist), 0);
}

export type Suggestion = {
  /** Le mieux doté en stats de base parmi les Pokémon de mêmes types. */
  option: TeamOption;
  /** Autres Pokémon de mêmes types, les plus forts d'abord. */
  alternatives: TeamOption[];
  /** Points faibles de l'équipe auxquels il résiste (multiplicateur < 1, 0 pour une immunité). */
  resists: { type: TypeRef; factor: number }[];
  /** Types encore non couverts qu'il touche en super efficace avec l'un de ses types. */
  covers: TypeRef[];
};

/**
 * Pokémon du jeu qui comblent le mieux les points faibles de l'équipe : ceux dont l'arrivée réduit le plus
 * les faiblesses non compensées (une faiblesse ajoutée compte contre lui), puis qui résistent au plus de
 * points faibles, couvrent le plus de types non couverts et ont les meilleures stats de base.
 * Un seul par combinaison de types : les autres sont proposés en alternative.
 */
export function suggestMembers(data: Chart, team: (TeamOption | null)[], options: TeamOption[], { legendary = false, limit = 9 } = {}): Suggestion[] {
  const members = team.filter((m) => m !== null);
  const defense = analyzeDefense(data, team);
  const weaknesses = teamWeaknesses(defense);
  if (members.length === 0 || weaknesses.length === 0) return [];

  const before = weaknessPressure(defense);
  const uncovered = analyzeOffense(data, team).filter((r) => r.hitters.length === 0);
  const inTeam = new Set(members.map((m) => m.speciesId));

  const scored = options
    .filter((o) => !inTeam.has(o.speciesId) && (legendary || !o.legendary))
    .map((option) => ({
      option,
      gain: before - weaknessPressure(analyzeDefense(data, [...team, option])),
      resists: weaknesses
        .map((r) => ({ type: r.type, factor: multiplier(data, r.type.slug, option.types) }))
        .filter((r) => r.factor < 1)
        .sort((a, b) => a.factor - b.factor),
      covers: uncovered.filter((r) => option.types.some((t) => multiplier(data, t.slug, [r.type]) > 1)).map((r) => r.type),
    }))
    .filter((s) => s.gain > 0)
    .sort(
      (a, b) =>
        b.gain - a.gain ||
        b.resists.length - a.resists.length ||
        b.covers.length - a.covers.length ||
        b.option.baseTotal - a.option.baseTotal,
    );

  // Une carte par combinaison de types : le premier du classement, les suivants en alternative.
  const byTypes = new Map<string, Suggestion>();
  for (const { option, resists, covers } of scored) {
    const key = option.types.map((t) => t.slug).sort().join("+");
    const existing = byTypes.get(key);
    if (existing) existing.alternatives.push(option);
    else byTypes.set(key, { option, alternatives: [], resists, covers });
  }
  return [...byTypes.values()].slice(0, limit);
}

/** « ×2 », « ½ », « 0 » ; chaîne vide pour ×1. */
export function formatFactor(factor: number) {
  if (factor === 1) return "";
  if (factor === 0) return "0";
  if (factor === 0.5) return "½";
  if (factor === 0.25) return "¼";
  return `×${factor}`;
}

/** Équipe ↔ paramètre d'URL : « 25-0-6 » (0 = emplacement vide, emplacements vides de fin omis). */
export function encodeTeam(team: (number | null)[]) {
  const ids = team.map((id) => id ?? 0);
  while (ids.length > 0 && ids[ids.length - 1] === 0) ids.pop();
  return ids.join("-");
}

export function decodeTeam(value: string | string[] | undefined, available: Set<number>): (number | null)[] {
  const parts = typeof value === "string" ? value.split("-").slice(0, TEAM_SIZE) : [];
  return Array.from({ length: TEAM_SIZE }, (_, i) => {
    const id = Number(parts[i]);
    return Number.isInteger(id) && available.has(id) ? id : null;
  });
}
