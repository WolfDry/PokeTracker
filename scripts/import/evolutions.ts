// Libellés français de l'arbre d'évolution : conditions d'évolution et formes alternatives.
import type { Row } from "./csv";

export type EvolutionLookups = {
  triggerSlug: (id: string) => string;
  triggerFr: (id: string) => string;
  itemFr: (id: string) => string;
  moveFr: (id: string) => string;
  typeFr: (id: string) => string;
  speciesFr: (id: string) => string;
  locationFr: (id: string) => string;
};

const TIME_OF_DAY_FR: Record<string, string> = { day: "de jour", night: "de nuit", dusk: "au crépuscule", full_moon: "pleine lune" };
const GENDER_FR: Record<string, string> = { "1": "femelle", "2": "mâle" };
const RELATIVE_STATS_FR: Record<string, string> = { "1": "Atq > Déf", "-1": "Atq < Déf", "0": "Atq = Déf" };

/**
 * Condition courte pour l'arbre (« Niv. 16 », « Pierre Foudre », « Échange tenant Peau Métal »).
 * Une ligne de `pokemon_evolution` = une façon d'obtenir l'espèce ; on concatène ses critères.
 */
export function evolutionConditionFr(row: Row, lookups: EvolutionLookups): string {
  const trigger = lookups.triggerSlug(row.evolution_trigger_id);
  const parts: string[] = [];

  if (trigger === "level-up") {
    if (row.minimum_level) parts.push(`Niv. ${row.minimum_level}`);
    else if (row.minimum_happiness) parts.push("Bonheur");
    else if (row.minimum_affection) parts.push("Affection");
    else if (row.minimum_beauty) parts.push("Beauté");
    else parts.push("Montée de niveau");
    if (row.minimum_happiness && row.minimum_level) parts.push("bonheur");
  } else if (trigger === "trade") {
    parts.push("Échange");
    if (row.trade_species_id) parts.push(`contre ${lookups.speciesFr(row.trade_species_id)}`);
  } else if (trigger === "use-item") {
    parts.push(row.trigger_item_id ? lookups.itemFr(row.trigger_item_id) : "Objet");
  } else if (trigger === "shed") {
    parts.push("Place libre et Poké Ball");
  } else {
    parts.push(lookups.triggerFr(row.evolution_trigger_id));
  }

  if (row.held_item_id) parts.push(`tenant ${lookups.itemFr(row.held_item_id)}`);
  if (row.known_move_id) parts.push(`connaît ${lookups.moveFr(row.known_move_id)}`);
  if (row.known_move_type_id) parts.push(`capacité ${lookups.typeFr(row.known_move_type_id)}`);
  if (row.location_id) parts.push(`à ${lookups.locationFr(row.location_id)}`);
  if (row.party_species_id) parts.push(`avec ${lookups.speciesFr(row.party_species_id)} dans l'équipe`);
  if (row.party_type_id) parts.push(`avec un Pokémon ${lookups.typeFr(row.party_type_id)} dans l'équipe`);
  if (row.time_of_day) parts.push(TIME_OF_DAY_FR[row.time_of_day] ?? row.time_of_day);
  if (row.gender_id) parts.push(GENDER_FR[row.gender_id] ?? "");
  if (row.relative_physical_stats) parts.push(RELATIVE_STATS_FR[row.relative_physical_stats] ?? "");
  if (row.needs_overworld_rain === "1") parts.push("sous la pluie");
  if (row.turn_upside_down === "1") parts.push("console à l'envers");
  if (row.minimum_move_count) parts.push(`${row.minimum_move_count} utilisations`);
  if (row.minimum_steps) parts.push(`${row.minimum_steps} pas`);
  if (row.minimum_damage_taken) parts.push(`${row.minimum_damage_taken} PV de dégâts`);

  return parts.filter(Boolean).join(" · ");
}

/**
 * Comment obtenir une forme alternative, d'après son slug PokeAPI :
 * Méga-Gemme (« Florizarrite »), « Gigamax »… ; null quand il n'y a rien à dire (formes régionales, motifs).
 */
export function formConditionFr(pokemonSlug: string, speciesSlug: string, itemFrBySlug: (slug: string) => string | undefined): string | null {
  const mega = pokemonSlug.match(/-mega(?:-([xyz]))?$/);
  if (mega) {
    const suffix = mega[1] ? `-${mega[1]}` : "";
    return itemFrBySlug(`${speciesSlug}ite${suffix}`) ?? itemFrBySlug(`${speciesSlug}ite`) ?? "Méga-Gemme";
  }
  if (pokemonSlug.endsWith("-gmax")) return "Gigamax";
  if (pokemonSlug.endsWith("-eternamax")) return "Infinimax";
  if (pokemonSlug === "kyogre-primal") return "Gemme Bleue";
  if (pokemonSlug === "groudon-primal") return "Gemme Rouge";
  return null;
}
