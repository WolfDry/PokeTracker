// Commun aux vues du living dex (mosaïque, boîtes, itinéraire) et à son panneau de détail.

/** Lieu du jeu dans l'ordre de progression, avec sa région : un arrêt possible de l'itinéraire. */
export type RouteLocation = { id: number; region: string };

/** Pokémon par boîte, comme dans le PC des jeux. */
export const BOX_SIZE = 30;

/** Vocabulaire du living dex (« attrapé ») et du shiny dex (« obtenu »). */
export const WORDING = {
  captures: {
    caught: "Attrapé",
    caughtPlural: "Attrapés",
    mark: "comme attrapé",
    unmark: "des captures",
    markButton: "Marquer comme attrapé",
    unmarkButton: "Retirer des captures",
    caughtIn: "Attrapé dans",
    notYet: "Pas encore attrapé dans un jeu.",
  },
  shiny: {
    caught: "Obtenu",
    caughtPlural: "Obtenus",
    mark: "comme obtenu en shiny",
    unmark: "des shinies",
    markButton: "Marquer comme obtenu",
    unmarkButton: "Retirer des shinies",
    caughtIn: "Obtenu dans",
    notYet: "Pas encore obtenu en shiny.",
  },
};
export type Wording = (typeof WORDING)["captures"];

export const formatLevel = (min: number, max: number) => (min === max ? `Niv. ${min}` : `Niv. ${min}–${max}`);

/** Case qui coche : « Marquer Germignon comme attrapé », « Retirer Germignon des shinies ». */
export const toggleLabel = (name: string, caught: boolean, wording: Wording = WORDING.captures) =>
  `${caught ? "Retirer" : "Marquer"} ${name} ${caught ? wording.unmark : wording.mark}`;

/** Case de la mosaïque ou d'une boîte : elle montre le Pokémon, ou le coche en mode « Coche rapide ». */
export const pickLabel = (name: string, caught: boolean, quick: boolean, wording: Wording, hunting = false) =>
  (quick ? toggleLabel(name, caught, wording) : `Voir ${name} (${caught ? wording.caught.toLowerCase() : "manquant"})`) +
  (hunting ? ", shasse en cours" : "");

/** Bouton rond (précédent, suivant, fermer) : 44 px, bordure forte. */
export const roundButton =
  "grid size-11 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-ink transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-40";
