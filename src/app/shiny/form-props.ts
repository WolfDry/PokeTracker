import "server-only";

import type { ShinyFormInitial } from "@/components/shiny-forms";
import { getGameOptions, getVersionBySlug } from "@/lib/data/games";
import { getSpeciesById } from "@/lib/data/species";

/**
 * Données des formulaires « Nouvelle chasse » et « Ajouter un shiny » : liste des jeux et
 * présélection depuis l'URL (`?espece=25&jeu=red`, liens des fiches Pokémon).
 */
export async function loadShinyFormProps(searchParams: Promise<{ espece?: string | string[]; jeu?: string | string[] }>) {
  const { espece, jeu } = await searchParams;
  const speciesId = typeof espece === "string" ? Number(espece) : NaN;
  const versionSlug = typeof jeu === "string" ? jeu : null;

  const [games, species, version] = await Promise.all([
    getGameOptions(),
    Number.isInteger(speciesId) && speciesId > 0 ? getSpeciesById(speciesId) : null,
    versionSlug ? getVersionBySlug(versionSlug) : null,
  ]);

  const initial: ShinyFormInitial = {
    species: species ? { id: species.id, nameFr: species.nameFr, pokemonId: species.defaultPokemon.id } : null,
    versionId: version?.id,
  };
  return { games, initial };
}
