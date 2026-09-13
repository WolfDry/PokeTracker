// Libellés français maintenus à la main quand ceux de PokeAPI ne conviennent pas à l'affichage.

/**
 * Méthodes de rencontre : PokeAPI fournit des phrases ("En marchant dans les herbes
 * hautes ou une grotte"), on veut un libellé court pour les tableaux. Clé = slug PokeAPI.
 * La phrase complète reste disponible en anglais dans `nameEn`.
 */
export const METHOD_LABELS_FR: Record<string, string> = {
  walk: "Herbes hautes / grotte",
  "old-rod": "Canne",
  "good-rod": "Super Canne",
  "super-rod": "Méga Canne",
  surf: "Surf",
  "rock-smash": "Éclate-Roc",
  headbutt: "Coup d'Boule",
  "dark-grass": "Herbes sombres",
  "grass-spots": "Herbes mouvantes",
  "cave-spots": "Nuage de poussière",
  "bridge-spots": "Ombre de pont",
  "super-rod-spots": "Méga Canne (endroit sombre)",
  "surf-spots": "Surf (endroit sombre)",
  "yellow-flowers": "Fleurs jaunes",
  "purple-flowers": "Fleurs violettes",
  "red-flowers": "Fleurs rouges",
  "rough-terrain": "Terrain accidenté",
  gift: "Cadeau",
  "gift-egg": "Œuf en cadeau",
  static: "Rencontre fixe",
  pokeflute: "Pokéflûte",
  "headbutt-low": "Coup d'Boule (taux bas)",
  "headbutt-normal": "Coup d'Boule (taux normal)",
  "headbutt-high": "Coup d'Boule (taux élevé)",
  "squirt-bottle": "Carapuce à O",
  "wailmer-pail": "Seau Wailmer",
  seaweed: "Algues (plongée)",
  "roaming-grass": "Errant (herbes)",
  "roaming-water": "Errant (eau)",
  "devon-scope": "Devon Scope",
  "feebas-tile-fishing": "Pêche (case Barpau)",
  "island-scan": "Scan des Îles",
  sos: "Appel SOS",
  "bubbling-spots": "Point à bulles",
  "berry-trees": "Arbre à baies",
  "npc-trade": "Échange PNJ",
  "sos-from-bubbling-spot": "Appel SOS (point à bulles)",
  overworld: "Monde extérieur",
  "overworld-water": "Monde extérieur (eau)",
  "overworld-flying": "Monde extérieur (ciel)",
  "overworld-special": "Apparition rare",
  "overworld-flying-special": "Apparition rare (ciel)",
  "overworld-water-special": "Apparition rare (eau)",
  horde: "Horde",
  "colosseum-bonus-disc-us": "Disque bonus Colosseum (US)",
  "colosseum-bonus-disc-jpn": "Disque bonus Colosseum (JP)",
  "pokemon-channel-pal": "Pokémon Channel (PAL)",
  "pokemon-ranger": "Pokémon Ranger",
  "pokemon-battle-revolution": "Pokémon Battle Revolution",
  "new-york-pokecenter-wish-eggs": "Œuf Vœu (Pokémon Center NY)",
  snag: "Snag",
  "snag-rematch": "Snag (revanche)",
  pokespot: "Poké Place",
  "hidden-grotto": "Trouée cachée",
  "honey-tree": "Arbre à Miel",
  "overworld-dirt": "Monde extérieur (terre)",
  wanderer: "Emplacement fixe",
  "wanderer-water": "Emplacement fixe (eau)",
  "chase-water": "Poursuite (eau)",
  "dynamax-adventure": "Expédition Dynamax",
  "max-raid": "Raid Dynamax",
  "trash-can-ambush": "Embuscade (poubelle)",
  "rustling-bush-ambush": "Embuscade (buisson)",
  "ceiling-ambush": "Embuscade (plafond)",
  "ground-ambush": "Embuscade (sol)",
  "sky-ambush": "Embuscade (ciel)",
};

/** Versions dont le nom PokeAPI est ambigu (les originaux japonais s'appellent aussi Rouge/Bleu). */
export const VERSION_LABELS_FR: Record<string, string> = {
  "red-japan": "Rouge (Japon)",
  "green-japan": "Vert (Japon)",
  "blue-japan": "Bleu (Japon)",
};

/**
 * Valeurs de condition de rencontre : PokeAPI n'en traduit qu'une partie en français (et parfois
 * mal : « swarm » devient « tempête »), le reste tombe sur des phrases anglaises. Libellés courts
 * pour la colonne « Conditions », prioritaires sur ceux de PokeAPI. Clé = slug PokeAPI.
 * Les familles régulières (échanges, jetons, blocs Safari…) sont traitées par motif dans
 * `conditionValueLabelFr`, seulement quand PokeAPI n'a pas de français.
 */
const CONDITION_VALUE_LABELS_FR: Record<string, string> = {
  // Essaims (traduits « tempête » chez PokeAPI)
  "swarm-yes": "Pendant un essaim",
  "swarm-no": "Hors essaim",
  // Météo (Épée / Bouclier)
  "weather-normal": "Temps normal",
  "weather-overcast": "Temps couvert",
  "weather-raining": "Pluie",
  "weather-thunderstorm": "Orage",
  "weather-snowing": "Neige",
  "weather-snowstorm": "Tempête de neige",
  "weather-sandstorm": "Tempête de sable",
  "weather-intense-sun": "Soleil intense",
  "weather-fog": "Brouillard",
  // Raids Dynamax
  "max-den-rarity-common": "Antre à lumière rouge",
  "max-den-rarity-rare": "Antre à lumière violette",
  "max-den-rarity-special": "Antre à lumière rouge (Infos Terres Sauvages)",
  "max-den-rating-1-star": "Raid 1 étoile",
  "max-den-rating-2-star": "Raid 2 étoiles",
  "max-den-rating-3-star": "Raid 3 étoiles",
  "max-den-rating-4-star": "Raid 4 étoiles",
  "max-den-rating-5-star": "Raid 5 étoiles",
  // Progression
  "story-progress-before-hall-of-fame": "Avant le Panthéon",
  "story-progress-before-national-dex": "Avant le Pokédex National",
  "story-progress-master-dojo-complete-first-trial": "Après la 1re épreuve du Dojo",
  "story-progress-master-dojo-complete-third-trial": "Après les 3 épreuves du Dojo",
  "story-progress-save-village-from-glastrier-spectrier": "Après avoir sauvé Frigedieu",
  "story-progress-catch-five-ultra-beasts": "5 Ultra-Chimères capturées en Expédition Dynamax",
  "story-progress-catch-all-shadow-pokemon": "Tous les Pokémon Obscurs capturés",
  // Arbres (DPPt / HGSS)
  "honey-tree-group-a": "Arbre à Miel groupe A (70 % ; 20 % sur arbre à Goinfrex)",
  "honey-tree-group-b": "Arbre à Miel groupe B (20 % ; 70 % sur arbre à Goinfrex)",
  "honey-tree-group-c": "Arbre à Miel groupe C (0 % ; 1 % sur arbre à Goinfrex)",
  "headbutt-tree-common": "Arbre courant",
  "headbutt-tree-rare": "Arbre rare",
  "headbutt-tree-secret": "Arbre secret",
  // Divers
  "friend-safari-slot-1": "Safari des Amis : emplacement 1",
  "friend-safari-slot-2": "Safari des Amis : emplacement 2",
  "friend-safari-slot-3": "Safari des Amis : emplacement 3",
  "great-marsh-daily-slot-none": "Grand Marais : hors rotation du jour",
  "backlot-mentioned": "Mentionné par M. Backlot",
  "backlot-not-mentioned": "Non mentionné par M. Backlot",
  "bug-catching-contest-yes": "Pendant le Concours de Capture",
  "bug-catching-contest-no": "Hors Concours de Capture",
  "save-data-from-lets-go-pikachu": "Sauvegarde Let's Go Pikachu présente",
  "save-data-from-lets-go-eevee": "Sauvegarde Let's Go Évoli présente",
  "johto-safari-blocks-inactive": "Sans blocs Safari",
  "trade-any-pokemon": "Échange contre n'importe quel Pokémon",
  "trade-togepi-or-togetic": "Échange contre Togepi ou Togetic",
  "other-complete-mt-battle": "Mont Bataille terminé",
  "other-giratina-not-caught-in-distortion-world": "Giratina non capturé dans le Monde Distorsion",
  "other-find-50-cavern-footprints": "50 empreintes de caverne trouvées",
  "other-find-50-grassland-footprints": "50 empreintes de prairie trouvées",
  "other-find-50-iron-will-footprints": "50 empreintes de volonté de fer trouvées",
  "other-regirock-regice-registeel-regieleki-regidrago-in-party": "Regirock, Regice, Registeel, Regieleki et Regidrago dans l'équipe",
  "other-choose-regieleki-pattern": "Motif Regieleki activé",
  "other-choose-regidrago-pattern": "Motif Regidrago activé",
  "other-grow-iceroot-carrot": "Carotte Givre cultivée",
  "other-grow-shaderoot-carrot": "Carotte Ombre cultivée",
  "other-talked-to-32-people": "Après avoir parlé à 32 personnes",
  "other-eat-curry-with-cobalion-terrakion-virizion": "Curry mangé avec Cobaltium, Terrakium et Viridium",
  "other-witness-galarian-bird-fight": "Après le combat des oiseaux de Galar",
  "trash-can-type-daily": "Poubelle qui tremble (chaque jour)",
  "trash-can-type-tuesday": "Poubelle qui tremble (mardi)",
  "trash-can-type-thursday": "Poubelle qui tremble (jeudi)",
};

const ITEM_LABELS_FR: Record<string, string> = {
  "helix-fossil": "Nautile",
  "dome-fossil": "Fossile Dôme",
  "old-amber": "Vieil Ambre",
  "skull-fossil": "Fossile Crâne",
  "armor-fossil": "Fossile Armure",
  "cover-fossil": "Fossile Plaque",
  "plume-fossil": "Fossile Plume",
  "fossilized-bird": "Fossile Oiseau",
  "fossilized-drake": "Fossile Dragon",
  "fossilized-dino": "Fossile Dino",
  "fossilized-fish": "Fossile Poisson",
  "reins-of-unity": "Rênes de l'Unité",
};

const SAFARI_BLOCK_LABELS_FR: Record<string, string> = { plains: "Plaine", forest: "Forêt", peak: "Sommet", water: "Eau" };
const BERRY_TREE_COLORS_FR: Record<string, string> = { red: "rouge", blue: "bleu", purple: "violet", green: "vert", yellow: "jaune", pink: "rose" };
const REGIONAL_FORMS_FR: Record<string, string> = { galar: "Galar", alola: "Alola", hisui: "Hisui", paldea: "Paldea" };

/**
 * Libellé français d'une valeur de condition : le nôtre, sinon celui de PokeAPI (`apiFr`), sinon par
 * motif ; `undefined` si rien ne s'applique. `speciesNameFr(slug)` résout les Pokémon cités dans les
 * slugs (trade-abra, starter-grookey…).
 */
export function conditionValueLabelFr(
  slug: string,
  apiFr: string | undefined,
  speciesNameFr: (speciesSlug: string) => string | undefined,
): string | undefined {
  const fixed = CONDITION_VALUE_LABELS_FR[slug] ?? apiFr;
  if (fixed) return fixed;

  const pokemon = (name: string) => {
    // "meowth-galar" → "Miaouss de Galar".
    const regional = name.match(/^(.+)-(galar|alola|hisui|paldea)$/);
    if (regional) return `${speciesNameFr(regional[1]) ?? regional[1]} de ${REGIONAL_FORMS_FR[regional[2]]}`;
    return speciesNameFr(name) ?? name;
  };

  let m: RegExpMatchArray | null;
  if ((m = slug.match(/^trade-(.+)$/))) return `Échange contre ${pokemon(m[1])}`;
  if ((m = slug.match(/^starter-(.+)$/))) return `${pokemon(m[1])} en starter`;
  if ((m = slug.match(/^other-caught-(.+)$/))) return `${pokemon(m[1])} capturé`;
  if ((m = slug.match(/^coins-(\d+)$/))) return `Au moins ${m[1]} jetons`;
  if ((m = slug.match(/^item-(.+)$/))) return `${ITEM_LABELS_FR[m[1]] ?? m[1]} dans le sac`;
  if ((m = slug.match(/^johto-safari-blocks-(\w+)-min-(\d+)$/))) return `Au moins ${m[2]} points de blocs ${SAFARI_BLOCK_LABELS_FR[m[1]] ?? m[1]}`;
  if ((m = slug.match(/^great-marsh-daily-slot-(\d+)-of-32$/))) return `Grand Marais : ${m[1]} chance${m[1] === "1" ? "" : "s"} sur 32 par jour`;
  if ((m = slug.match(/^alolan-diglett-found-(\d+)$/))) return `${m[1]} Taupiqueur d'Alola trouvés`;
  if ((m = slug.match(/^berry-tree-type-(\w+)$/))) return `Arbre à baies ${BERRY_TREE_COLORS_FR[m[1]] ?? m[1]}`;
  return undefined;
}

/** Lieux sans nom chez PokeAPI (le slug serait affiché tel quel). */
export const LOCATION_LABELS_FR: Record<string, string> = {
  "kanto-pokemart": "Boutique Pokémon (Kanto)",
  "johto-pokemart": "Boutique Pokémon (Johto)",
  "hoenn-pokemart": "Boutique Pokémon (Hoenn)",
  "sinnoh-pokemart": "Boutique Pokémon (Sinnoh)",
};
