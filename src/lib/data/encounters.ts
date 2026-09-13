"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { dlcVersionSlugs, HIDDEN_LOCATION_PREFIX, humanizeSlug, isHiddenLocation, isHiddenVersion } from "@/lib/data/filters";
import { getVersionBySlug } from "@/lib/data/games";
import {
  collapseConditionRows,
  type ConditionMeta,
  type EncounterArea,
  type EncounterConditionRef,
  type EncounterMethodRef,
  type EncounterPokemon,
  type EncounterRow,
  type EncounterVersion,
  type LocationEncounterTable,
} from "@/lib/encounters";
import { prisma } from "@/lib/prisma";

// Rencontres jeu × lieu. Tout est en `use cache` : les données ne changent qu'à l'import
// (après un import, relancer `next dev` ou appeler /api/revalidate en prod).

export type VersionLocation = {
  id: number;
  slug: string;
  nameFr: string;
  areaCount: number;
  speciesCount: number;
};

export type VersionLocationGroup = { region: string; locations: VersionLocation[] };

/** Lieux d'un jeu où l'on rencontre des Pokémon, regroupés par région et triés (Route 1, 2… 10). */
export async function getVersionLocations(versionSlug: string) {
  cacheLife("max");
  cacheTag("reference");

  const version = await getVersionBySlug(versionSlug);
  if (!version) return null;

  const rows = await prisma.$queryRaw<(VersionLocation & { region: string | null })[]>`
    SELECT l.id, l.slug, l."nameFr", r."nameFr" AS region,
      COUNT(DISTINCT la.id)::int AS "areaCount",
      COUNT(DISTINCT p."speciesId")::int AS "speciesCount"
    FROM "Encounter" e
    JOIN "LocationArea" la ON la.id = e."locationAreaId"
    JOIN "Location" l ON l.id = la."locationId"
    LEFT JOIN "Region" r ON r.id = l."regionId"
    JOIN "Pokemon" p ON p.id = e."pokemonId"
    WHERE e."versionId" = ${version.id} AND l.slug NOT LIKE ${HIDDEN_LOCATION_PREFIX + "%"}
    GROUP BY l.id, r."nameFr"`;

  const byRegion = new Map<string, VersionLocation[]>();
  for (const { region, ...location } of rows) {
    const key = region ?? "Autres lieux";
    byRegion.set(key, [...(byRegion.get(key) ?? []), location]);
  }
  const collator = new Intl.Collator("fr", { numeric: true });
  const groups: VersionLocationGroup[] = [...byRegion.entries()]
    .map(([region, locations]) => ({ region, locations: locations.sort((a, b) => collator.compare(a.nameFr, b.nameFr)) }))
    // Région principale du jeu d'abord (celle avec le plus de lieux), puis les autres.
    .sort((a, b) => b.locations.length - a.locations.length);

  return { version, groups, locationCount: rows.length };
}

export type SpeciesLocation = {
  id: number;
  slug: string;
  nameFr: string;
  /** Version qui porte la table de rencontre (le jeu de base, ou son extension pour un lieu de DLC). */
  versionSlug: string;
  methods: string[];
  minLevel: number;
  maxLevel: number;
};

/**
 * Index « espèce → lieux » d'un jeu, pour lister les Pokémon manquants avec où les trouver.
 * Toutes les formes confondues, extensions du jeu incluses (Épée ⊃ Isolarmure, Couronneige) ;
 * méthodes dans l'ordre PokeAPI, niveaux min/max tous lieux.
 */
export async function getVersionSpeciesLocations(versionId: number): Promise<Record<number, SpeciesLocation[]>> {
  cacheLife("max");
  cacheTag("reference");

  const version = await prisma.version.findUnique({ where: { id: versionId }, select: { slug: true } });
  if (!version) return {};

  const encounters = await prisma.encounter.findMany({
    where: {
      version: { slug: { in: [version.slug, ...dlcVersionSlugs(version.slug)] } },
      locationArea: { location: { slug: { not: { startsWith: HIDDEN_LOCATION_PREFIX } } } },
    },
    select: {
      minLevel: true,
      maxLevel: true,
      pokemon: { select: { speciesId: true } },
      method: { select: { nameFr: true, order: true } },
      version: { select: { slug: true } },
      locationArea: { select: { location: { select: { id: true, slug: true, nameFr: true } } } },
    },
  });

  type Acc = SpeciesLocation & { methodOrder: Map<string, number> };
  const bySpecies = new Map<number, Map<number, Acc>>();
  for (const e of encounters) {
    const locations = bySpecies.get(e.pokemon.speciesId) ?? new Map<number, Acc>();
    const location = e.locationArea.location;
    const entry = locations.get(location.id) ?? {
      ...location,
      versionSlug: e.version.slug,
      methods: [],
      methodOrder: new Map(),
      minLevel: e.minLevel,
      maxLevel: e.maxLevel,
    };
    // Un lieu présent dans le jeu de base et une extension : on renvoie vers le jeu de base.
    if (e.version.slug === version.slug) entry.versionSlug = version.slug;
    entry.methodOrder.set(e.method.nameFr, e.method.order);
    entry.minLevel = Math.min(entry.minLevel, e.minLevel);
    entry.maxLevel = Math.max(entry.maxLevel, e.maxLevel);
    locations.set(location.id, entry);
    bySpecies.set(e.pokemon.speciesId, locations);
  }

  const collator = new Intl.Collator("fr", { numeric: true });
  const index: Record<number, SpeciesLocation[]> = {};
  for (const [speciesId, locations] of bySpecies) {
    index[speciesId] = [...locations.values()]
      .sort((a, b) => collator.compare(a.nameFr, b.nameFr))
      .map(({ methodOrder, ...location }) => ({
        ...location,
        methods: [...methodOrder.entries()].sort((a, b) => a[1] - b[1]).map(([name]) => name),
      }));
  }
  return index;
}

/**
 * Tableau des rencontres d'un lieu pour un jeu et ses versions jumelles (même groupe) :
 * une ligne par Pokémon × méthode × conditions, avec le taux cumulé des slots et les niveaux par version.
 */
export async function getLocationEncounters(versionSlug: string, locationSlug: string) {
  cacheLife("max");
  cacheTag("reference");

  const version = await getVersionBySlug(versionSlug);
  if (!version || isHiddenLocation(locationSlug)) return null;
  const location = await prisma.location.findUnique({
    where: { slug: locationSlug },
    select: {
      id: true,
      slug: true,
      nameFr: true,
      region: { select: { nameFr: true } },
      areas: { orderBy: { id: "asc" }, select: { id: true, slug: true, nameFr: true } },
    },
  });
  if (!location) return null;

  // Le jeu demandé d'abord, puis ses jumelles.
  const versions: EncounterVersion[] = [
    { id: version.id, slug: version.slug, nameFr: version.nameFr },
    ...version.siblings.filter((v) => !isHiddenVersion(v.slug)),
  ];
  const versionIds = versions.map((v) => v.id);
  const areaIds = location.areas.map((a) => a.id);

  const [encounters, areaRates] = await Promise.all([
    prisma.encounter.findMany({
      where: { versionId: { in: versionIds }, locationAreaId: { in: areaIds } },
      select: {
        versionId: true,
        locationAreaId: true,
        rarity: true,
        minLevel: true,
        maxLevel: true,
        pokemon: { select: { id: true, speciesId: true, slug: true, isDefault: true, formNameFr: true, species: { select: { nameFr: true } } } },
        method: { select: { id: true, slug: true, nameFr: true, order: true } },
        conditions: { select: { conditionValue: { select: { id: true, conditionId: true, nameFr: true, isDefault: true } } } },
      },
    }),
    prisma.locationAreaEncounterRate.findMany({
      where: { versionId: { in: versionIds }, locationAreaId: { in: areaIds } },
      select: { locationAreaId: true, methodId: true, versionId: true, rate: true },
    }),
  ]);

  const methods = new Map<number, EncounterMethodRef>();
  const conditions: Record<number, EncounterConditionRef> = {};
  const pokemons: Record<number, EncounterPokemon> = {};
  const meta: ConditionMeta = { conditionOf: new Map(), defaults: new Set(), presentValues: new Map() };
  const rowsByArea = new Map<number, Map<string, EncounterRow>>();

  for (const e of encounters) {
    methods.set(e.method.id, e.method);
    pokemons[e.pokemon.id] ??= {
      speciesId: e.pokemon.speciesId,
      nameFr: e.pokemon.species.nameFr,
      formNameFr: e.pokemon.isDefault ? e.pokemon.formNameFr : (e.pokemon.formNameFr ?? humanizeSlug(e.pokemon.slug)),
      isDefault: e.pokemon.isDefault,
    };
    const conditionIds = e.conditions
      .map((c) => c.conditionValue)
      .map((value) => {
        conditions[value.id] = { id: value.id, conditionId: value.conditionId, nameFr: value.nameFr, isDefault: value.isDefault };
        meta.conditionOf.set(value.id, value.conditionId);
        if (value.isDefault) meta.defaults.add(value.id);
        meta.presentValues.set(value.conditionId, (meta.presentValues.get(value.conditionId) ?? new Set()).add(value.id));
        return value.id;
      })
      .sort((a, b) => a - b);

    const key = `${e.pokemon.id}-${e.method.id}-${conditionIds.join(".")}`;
    const areaRows = rowsByArea.get(e.locationAreaId) ?? new Map<string, EncounterRow>();
    const row = areaRows.get(key) ?? { pokemonId: e.pokemon.id, methodId: e.method.id, conditionIds, alternatives: [], byVersion: versions.map(() => null) };
    // Plusieurs slots pour le même Pokémon (ex. Chenipotte 20 % + 10 % + 10 % + 5 %) : on cumule.
    const index = versionIds.indexOf(e.versionId);
    const current = row.byVersion[index];
    row.byVersion[index] = current
      ? [current[0] + e.rarity, Math.min(current[1], e.minLevel), Math.max(current[2], e.maxLevel)]
      : [e.rarity, e.minLevel, e.maxLevel];
    areaRows.set(key, row);
    rowsByArea.set(e.locationAreaId, areaRows);
  }

  const methodOrder = (id: number) => methods.get(id)?.order ?? 0;
  const bestRate = (row: EncounterRow) => Math.max(...row.byVersion.map((v) => v?.[0] ?? 0));

  // Zone principale (sans nom propre) d'abord, puis les sous-zones (étages, antres…) par id.
  const isMainArea = (area: { slug: string | null; nameFr: string | null }) => !area.slug || area.slug === "main" || area.nameFr === location.nameFr;
  const areas: EncounterArea[] = location.areas
    .filter((area) => rowsByArea.has(area.id))
    .sort((a, b) => Number(isMainArea(b)) - Number(isMainArea(a)) || a.id - b.id)
    .map((area) => ({
      id: area.id,
      nameFr: area.nameFr ?? location.nameFr,
      rates: areaRates.filter((r) => r.locationAreaId === area.id).map(({ methodId, versionId, rate }) => ({ methodId, versionId, rate })),
      rows: collapseConditionRows([...rowsByArea.get(area.id)!.values()], meta).sort(
        (a, b) =>
          methodOrder(a.methodId) - methodOrder(b.methodId) ||
          bestRate(b) - bestRate(a) ||
          pokemons[a.pokemonId].speciesId - pokemons[b.pokemonId].speciesId ||
          a.pokemonId - b.pokemonId ||
          a.conditionIds.length - b.conditionIds.length,
      ),
    }));

  const table: LocationEncounterTable = {
    versions,
    methods: [...methods.values()].sort((a, b) => a.order - b.order),
    conditions,
    pokemons,
    areas,
  };

  return {
    version,
    location: { id: location.id, slug: location.slug, nameFr: location.nameFr, region: location.region?.nameFr ?? null },
    table,
  };
}
