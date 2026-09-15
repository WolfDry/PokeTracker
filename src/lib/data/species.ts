"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { HIDDEN_LOCATION_PREFIX, humanizeSlug, isHiddenVersion } from "@/lib/data/filters";
import { prisma } from "@/lib/prisma";

export type SpeciesEncounterSummary = {
  version: { id: number; slug: string; nameFr: string };
  locations: {
    id: number;
    slug: string;
    nameFr: string;
    methods: string[];
    minLevel: number;
    maxLevel: number;
  }[];
};

/** Stats de base d'une forme. */
export type BaseStats = { hp: number; attack: number; defense: number; specialAttack: number; specialDefense: number; speed: number };

/** Nœud de l'arbre d'évolution : une espèce (forme par défaut) ou une forme alternative rattachée à son espèce. */
export type FamilyNode = {
  /** Id de la forme (unique dans l'arbre). */
  id: number;
  speciesId: number;
  /** Image de repli (forme par défaut de l'espèce) quand celle de la forme manque. */
  spriteFallbackId: number;
  kind: "species" | "form";
  nameFr: string;
  nameEn: string;
  genusFr: string | null;
  /** Légende de la carte : « N° 0003 » pour une espèce, « Forme Gigamax » pour une forme. */
  caption: string;
  /** Libellé sur le trait qui mène au nœud : « Niv. 16 », « Florizarrite »… */
  condition: string | null;
  generation: { id: number; nameFr: string };
  types: { slug: string; nameFr: string }[];
  flags: string[];
  height: number | null;
  weight: number | null;
  captureRate: number | null;
  stats: BaseStats | null;
  children: FamilyNode[];
};

const pokemonSelect = {
  id: true,
  slug: true,
  isDefault: true,
  nameFr: true,
  formNameFr: true,
  formConditionFr: true,
  height: true,
  weight: true,
  hp: true,
  attack: true,
  defense: true,
  specialAttack: true,
  specialDefense: true,
  speed: true,
  type1: { select: { slug: true, nameFr: true } },
  type2: { select: { slug: true, nameFr: true } },
} as const;

type PokemonRow = {
  id: number;
  slug: string;
  isDefault: boolean;
  nameFr: string | null;
  formNameFr: string | null;
  formConditionFr: string | null;
  height: number | null;
  weight: number | null;
  hp: number | null;
  attack: number | null;
  defense: number | null;
  specialAttack: number | null;
  specialDefense: number | null;
  speed: number | null;
  type1: { slug: string; nameFr: string };
  type2: { slug: string; nameFr: string } | null;
};

function baseStats(p: PokemonRow): BaseStats | null {
  if (p.hp === null || p.attack === null || p.defense === null || p.specialAttack === null || p.specialDefense === null || p.speed === null) return null;
  return { hp: p.hp, attack: p.attack, defense: p.defense, specialAttack: p.specialAttack, specialDefense: p.specialDefense, speed: p.speed };
}

function speciesFlags(s: { isLegendary: boolean; isMythical: boolean; isBaby: boolean }) {
  return [s.isLegendary && "Légendaire", s.isMythical && "Fabuleux", s.isBaby && "Bébé"].filter((flag): flag is string => Boolean(flag));
}

/**
 * Arbre d'évolution de l'espèce : toutes les espèces de sa chaîne, chacune portant ses évolutions puis ses
 * formes alternatives (Méga, Gigamax, régionales…) en enfants. Retourne la racine (premier stade).
 */
export async function getEvolutionFamily(speciesId: number): Promise<FamilyNode | null> {
  cacheLife("max");
  cacheTag("reference");

  const current = await prisma.species.findUnique({ where: { id: speciesId }, select: { evolutionChainId: true } });
  if (!current) return null;

  const family = await prisma.species.findMany({
    where: current.evolutionChainId === null ? { id: speciesId } : { evolutionChainId: current.evolutionChainId },
    orderBy: { id: "asc" },
    select: {
      id: true,
      nameFr: true,
      nameEn: true,
      genusFr: true,
      isLegendary: true,
      isMythical: true,
      isBaby: true,
      captureRate: true,
      evolvesFromSpeciesId: true,
      generation: { select: { id: true, nameFr: true } },
      pokemons: { orderBy: { id: "asc" }, select: pokemonSelect },
      evolutions: { orderBy: { id: "asc" }, select: { conditionFr: true, isDefault: true } },
    },
  });
  if (family.length === 0) return null;

  const ids = new Set(family.map((s) => s.id));
  const build = (species: (typeof family)[number]): FamilyNode | null => {
    const main = species.pokemons.find((p) => p.isDefault) ?? species.pokemons[0];
    if (!main) return null;
    const preferred = species.evolutions.filter((e) => e.isDefault);
    const conditions = [...new Set((preferred.length > 0 ? preferred : species.evolutions).map((e) => e.conditionFr))];
    const evolutions = family
      .filter((s) => s.evolvesFromSpeciesId === species.id)
      .map(build)
      .filter((node): node is FamilyNode => node !== null);
    const forms = species.pokemons
      .filter((p) => !p.isDefault)
      .map((p): FamilyNode => ({
        id: p.id,
        speciesId: species.id,
        spriteFallbackId: main.id,
        kind: "form",
        nameFr: p.nameFr ?? p.formNameFr ?? humanizeSlug(p.slug),
        nameEn: species.nameEn,
        genusFr: species.genusFr,
        caption: p.formNameFr ?? humanizeSlug(p.slug),
        condition: p.formConditionFr,
        generation: species.generation,
        types: [p.type1, p.type2].filter((t) => t !== null),
        flags: speciesFlags(species),
        height: p.height,
        weight: p.weight,
        captureRate: species.captureRate,
        stats: baseStats(p),
        children: [],
      }));
    return {
      id: main.id,
      speciesId: species.id,
      spriteFallbackId: main.id,
      kind: "species",
      nameFr: species.nameFr,
      nameEn: species.nameEn,
      genusFr: species.genusFr,
      caption: `N° ${String(species.id).padStart(4, "0")}`,
      condition: conditions.length > 0 ? conditions.join(" ou ") : null,
      generation: species.generation,
      types: [main.type1, main.type2].filter((t) => t !== null),
      flags: speciesFlags(species),
      height: main.height,
      weight: main.weight,
      captureRate: species.captureRate,
      stats: baseStats(main),
      children: [...evolutions, ...forms],
    };
  };

  // La racine est le stade sans parent dans la famille ; à défaut (données incomplètes), l'espèce demandée.
  const root =
    family.find((s) => s.evolvesFromSpeciesId === null || !ids.has(s.evolvesFromSpeciesId)) ?? family.find((s) => s.id === speciesId) ?? family[0];
  return build(root);
}

export async function getSpeciesById(id: number) {
  cacheLife("max");
  cacheTag("reference");

  const species = await prisma.species.findUnique({
    where: { id },
    include: {
      generation: { select: { id: true, nameFr: true } },
      pokemons: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          slug: true,
          isDefault: true,
          formNameFr: true,
          height: true,
          weight: true,
          type1: { select: { slug: true, nameFr: true } },
          type2: { select: { slug: true, nameFr: true } },
        },
      },
      pokedexEntries: {
        orderBy: { pokedexId: "asc" },
        select: {
          number: true,
          pokedex: {
            select: {
              id: true,
              slug: true,
              nameFr: true,
              isMainSeries: true,
              versionGroups: {
                select: {
                  versionGroup: {
                    select: {
                      order: true,
                      versions: { orderBy: { id: "asc" }, select: { id: true, slug: true, nameFr: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!species) return null;

  const defaultPokemon = species.pokemons.find((p) => p.isDefault) ?? species.pokemons[0];

  // Pokédex régionaux → jeux dans lesquels l'espèce figure.
  const pokedexes = species.pokedexEntries
    .filter((entry) => entry.pokedex.isMainSeries && entry.pokedex.slug !== "national")
    .map((entry) => ({
      id: entry.pokedex.id,
      slug: entry.pokedex.slug,
      nameFr: entry.pokedex.nameFr,
      number: entry.number,
      versions: entry.pokedex.versionGroups
        .sort((a, b) => a.versionGroup.order - b.versionGroup.order)
        .flatMap((vg) => vg.versionGroup.versions)
        .filter((v) => !isHiddenVersion(v.slug)),
    }));

  return {
    id: species.id,
    slug: species.slug,
    nameFr: species.nameFr,
    nameEn: species.nameEn,
    genusFr: species.genusFr,
    generation: species.generation,
    isLegendary: species.isLegendary,
    isMythical: species.isMythical,
    isBaby: species.isBaby,
    captureRate: species.captureRate,
    defaultPokemon: {
      ...defaultPokemon,
      types: [defaultPokemon.type1, defaultPokemon.type2].filter((t) => t !== null),
    },
    forms: species.pokemons
      .filter((p) => !p.isDefault)
      .map((p) => ({
        ...p,
        formNameFr: p.formNameFr ?? humanizeSlug(p.slug),
        types: [p.type1, p.type2].filter((t) => t !== null),
      })),
    pokedexes,
  };
}

/** Lieux de rencontre d'une espèce (toutes formes confondues), regroupés par jeu puis par lieu. */
export async function getSpeciesEncounters(speciesId: number): Promise<SpeciesEncounterSummary[]> {
  cacheLife("max");
  cacheTag("reference");

  const encounters = await prisma.encounter.findMany({
    where: {
      pokemon: { speciesId },
      version: { slug: { not: { endsWith: "-japan" } } },
      locationArea: { location: { slug: { not: { startsWith: HIDDEN_LOCATION_PREFIX } } } },
    },
    select: {
      minLevel: true,
      maxLevel: true,
      version: { select: { id: true, slug: true, nameFr: true, versionGroup: { select: { order: true } } } },
      method: { select: { nameFr: true, order: true } },
      locationArea: { select: { location: { select: { id: true, slug: true, nameFr: true } } } },
    },
  });

  type LocationAcc = SpeciesEncounterSummary["locations"][number] & { methodOrder: Map<string, number> };
  const byVersion = new Map<number, { version: SpeciesEncounterSummary["version"]; order: number; locations: Map<number, LocationAcc> }>();

  for (const e of encounters) {
    const versionEntry = byVersion.get(e.version.id) ?? {
      version: { id: e.version.id, slug: e.version.slug, nameFr: e.version.nameFr },
      order: e.version.versionGroup.order,
      locations: new Map<number, LocationAcc>(),
    };
    const location = e.locationArea.location;
    const locationEntry = versionEntry.locations.get(location.id) ?? {
      id: location.id,
      slug: location.slug,
      nameFr: location.nameFr,
      methods: [],
      methodOrder: new Map<string, number>(),
      minLevel: e.minLevel,
      maxLevel: e.maxLevel,
    };
    locationEntry.methodOrder.set(e.method.nameFr, e.method.order);
    locationEntry.minLevel = Math.min(locationEntry.minLevel, e.minLevel);
    locationEntry.maxLevel = Math.max(locationEntry.maxLevel, e.maxLevel);
    versionEntry.locations.set(location.id, locationEntry);
    byVersion.set(e.version.id, versionEntry);
  }

  return [...byVersion.values()]
    .sort((a, b) => a.order - b.order || a.version.id - b.version.id)
    .map((entry) => ({
      version: entry.version,
      locations: [...entry.locations.values()]
        .sort((a, b) => a.nameFr.localeCompare(b.nameFr, "fr"))
        .map(({ methodOrder, ...location }) => ({
          ...location,
          methods: [...methodOrder.entries()].sort((a, b) => a[1] - b[1]).map(([name]) => name),
        })),
    }));
}
