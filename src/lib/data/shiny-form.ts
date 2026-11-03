import "server-only";

import type { ShinyFormInitial } from "@/components/shiny-forms";
import { getGameOptions, getVersionBySlug } from "@/lib/data/games";
import { getPokemonForm, getSpeciesById } from "@/lib/data/species";

type Param = string | string[] | undefined;
const toId = (value: Param) => (typeof value === "string" && /^\d+$/.test(value) ? Number(value) : null);

/**
 * Données des formulaires « Nouvelle chasse » et « Ajouter un shiny » : liste des jeux et
 * présélection depuis l'URL (`?espece=19&forme=10091&jeu=sun`, liens des fiches Pokémon et du shiny dex).
 * Une `forme` qui n'appartient pas à l'espèce (ou de combat, comme une Méga) est ignorée.
 * `gameSlug` : jeu imposé par la page (onglet d'un jeu), prioritaire sur `?jeu=`.
 */
export async function loadShinyFormProps(searchParams: Promise<{ espece?: Param; forme?: Param; jeu?: Param }>, gameSlug?: string) {
  const { espece, forme, jeu } = await searchParams;
  const speciesId = toId(espece);
  const formId = toId(forme);
  const versionSlug = gameSlug ?? (typeof jeu === "string" ? jeu : null);

  const [games, species, form, version] = await Promise.all([
    getGameOptions(),
    speciesId ? getSpeciesById(speciesId) : null,
    formId ? getPokemonForm(formId) : null,
    versionSlug ? getVersionBySlug(versionSlug) : null,
  ]);

  const validForm = species && form && form.speciesId === species.id && !form.isBattleOnly ? form : null;
  const initial: ShinyFormInitial = {
    species: species && {
      id: species.id,
      nameFr: validForm?.nameFr ?? species.nameFr,
      pokemonId: validForm?.id ?? species.defaultPokemon.id,
    },
    versionId: version?.id,
  };
  return { games, initial };
}
