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
