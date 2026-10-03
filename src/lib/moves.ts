// Types et helpers partagés (serveur + client) des capacités de la page Équipe.
// Les requêtes sont dans src/lib/data/moves.ts.

export type MoveCategory = "physical" | "special";

/** Capacité offensive telle qu'elle était dans le jeu choisi (type, puissance et catégorie de l'époque). */
export type TeamMove = {
  id: number;
  nameFr: string;
  type: { slug: string; nameFr: string };
  category: MoveCategory;
  power: number | null;
  accuracy: number | null;
  /** Dégâts fixes ou proportionnels aux PV (Frappe Atlas, Croc Fatal…) : les faiblesses de type n'y changent rien. */
  fixedDamage: boolean;
};

/** Capacité qu'une forme peut apprendre dans le jeu, avec la façon la plus simple de l'apprendre. */
export type LearnableMove = TeamMove & { method: string; level: number | null };

/** Nombre de capacités d'un Pokémon. */
export const MAX_MOVES = 4;

/** La capacité sans la façon de l'apprendre, telle qu'elle est gardée dans l'équipe. */
export function toTeamMove({ id, nameFr, type, category, power, accuracy, fixedDamage }: LearnableMove): TeamMove {
  return { id, nameFr, type, category, power, accuracy, fixedDamage };
}

/** Capacités dont les dégâts ne dépendent pas des types (PokeAPI leur donne une puissance vide, ou 1). */
const FIXED_DAMAGE_MOVES = new Set([
  "sonic-boom",
  "dragon-rage",
  "seismic-toss",
  "night-shade",
  "psywave",
  "super-fang",
  "counter",
  "mirror-coat",
  "metal-burst",
  "bide",
  "endeavor",
  "final-gambit",
  "guillotine",
  "horn-drill",
  "fissure",
  "sheer-cold",
  "natures-madness",
  "guardian-of-alola",
  "ruination",
  "comeuppance",
]);

export function isFixedDamage(moveSlug: string) {
  return FIXED_DAMAGE_MOVES.has(moveSlug);
}

/** Avant la 4e génération, la catégorie d'une capacité offensive dépendait de son type. */
const SPECIAL_TYPES_BEFORE_GEN_4 = new Set(["fire", "water", "grass", "electric", "psychic", "ice", "dragon", "dark"]);

export function moveCategory(damageClass: string, typeSlug: string, generationId: number): MoveCategory {
  if (generationId < 4) return SPECIAL_TYPES_BEFORE_GEN_4.has(typeSlug) ? "special" : "physical";
  return damageClass === "special" ? "special" : "physical";
}

export const CATEGORY_LABELS: Record<MoveCategory, string> = { physical: "Physique", special: "Spéciale" };

/** « Niv. 36 », « Évolution », « CT », « Tuteur », « Œuf »… */
export function learnMethodLabel(method: string, level: number | null) {
  if (method === "level-up") return level === 0 ? "Évolution" : `Niv. ${level ?? 1}`;
  if (method === "machine") return "CT";
  if (method === "tutor") return "Tuteur";
  if (method === "egg") return "Œuf";
  return "Spécial";
}
