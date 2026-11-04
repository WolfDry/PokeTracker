// Commun aux vues du living dex (mosaïque, boîtes, itinéraire) et à son panneau de détail.

/** Lieu du jeu dans l'ordre de progression, avec sa région : un arrêt possible de l'itinéraire. */
export type RouteLocation = { id: number; region: string };

/** Pokémon par boîte, comme dans le PC des jeux. */
export const BOX_SIZE = 30;

export const formatLevel = (min: number, max: number) => (min === max ? `Niv. ${min}` : `Niv. ${min}–${max}`);

/** Case qui coche : « Marquer Germignon comme attrapé », « Retirer Germignon des captures ». */
export const toggleLabel = (name: string, caught: boolean) => `${caught ? "Retirer" : "Marquer"} ${name} ${caught ? "des captures" : "comme attrapé"}`;

/** Case de la mosaïque ou d'une boîte : elle montre le Pokémon, ou le coche en mode « Coche rapide ». */
export const pickLabel = (name: string, caught: boolean, quick: boolean) =>
  quick ? toggleLabel(name, caught) : `Voir ${name} (${caught ? "attrapé" : "manquant"})`;

/** Bouton rond (précédent, suivant, fermer) : 44 px, bordure forte. */
export const roundButton =
  "grid size-11 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-ink transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-40";
