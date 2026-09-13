/**
 * Import des données de référence PokeAPI (CSV du repo GitHub) dans notre base.
 *
 *   npm run import:data                 # import complet + sprites
 *   npm run import:data -- --refresh    # re-télécharge les CSV (mise à jour PokeAPI)
 *   npm run import:data -- --skip-sprites
 *   npm run import:data -- --sprites-only
 *
 * Relançable : les tables de dimension sont upsertées (les captures utilisateur qui
 * pointent vers Species/Version restent valides), les tables de faits sont rechargées.
 * Tout se passe dans une seule transaction.
 */
import "dotenv/config";
import type pg from "pg";
import { coverageFor } from "./coverage";
import { bool, int, loadCsv, localized, uniqueBy, type Row } from "./csv";
import { createPool, insertRows, type Rows } from "./db";
import { METHOD_LABELS_FR, VERSION_LABELS_FR } from "./labels";
import { downloadSprites } from "./sprites";

const args = new Set(process.argv.slice(2));
const options = {
  refresh: args.has("--refresh"),
  skipSprites: args.has("--skip-sprites"),
  spritesOnly: args.has("--sprites-only"),
};

const CSV_FILES = [
  "generations", "generation_names",
  "regions", "region_names",
  "types", "type_names",
  "version_groups", "version_group_regions",
  "versions", "version_names",
  "pokedexes", "pokedex_prose", "pokedex_version_groups", "pokemon_dex_numbers",
  "pokemon_species", "pokemon_species_names",
  "pokemon", "pokemon_types", "pokemon_forms", "pokemon_form_names",
  "locations", "location_names",
  "location_areas", "location_area_prose",
  "encounter_methods", "encounter_method_prose",
  "encounter_conditions", "encounter_condition_prose",
  "encounter_condition_values", "encounter_condition_value_prose",
  "encounter_slots", "encounters", "encounter_condition_value_map",
  "location_area_encounter_rates",
] as const;

type CsvName = (typeof CSV_FILES)[number];
type Csv = Record<CsvName, Row[]>;

async function loadAllCsv(): Promise<Csv> {
  const entries = await Promise.all(
    CSV_FILES.map(async (name) => [name, await loadCsv(name, { refresh: options.refresh })] as const),
  );
  return Object.fromEntries(entries) as Csv;
}

// ---------------------------------------------------------------------------
// Transformation CSV → lignes de nos tables
// ---------------------------------------------------------------------------

function transform(csv: Csv) {
  const generationNames = localized(csv.generation_names, "generation_id");
  const generations: Rows = csv.generations.map((g) => ({
    id: Number(g.id),
    slug: g.identifier,
    nameFr: generationNames.fr(g.id, g.identifier),
    nameEn: generationNames.en(g.id, g.identifier),
  }));

  const generationByMainRegion = new Map(csv.generations.map((g) => [g.main_region_id, Number(g.id)]));
  const regionNames = localized(csv.region_names, "region_id");
  const regions: Rows = csv.regions.map((r) => ({
    id: Number(r.id),
    slug: r.identifier,
    nameFr: regionNames.fr(r.id, r.identifier),
    nameEn: regionNames.en(r.id, r.identifier),
    generationId: generationByMainRegion.get(r.id) ?? null,
  }));

  const typeNames = localized(csv.type_names, "type_id");
  const types: Rows = csv.types.map((t) => ({
    id: Number(t.id),
    slug: t.identifier,
    nameFr: typeNames.fr(t.id, t.identifier),
    nameEn: typeNames.en(t.id, t.identifier),
  }));

  const versionGroups: Rows = csv.version_groups.map((vg) => ({
    id: Number(vg.id),
    slug: vg.identifier,
    generationId: Number(vg.generation_id),
    order: Number(vg.order),
  }));
  const versionGroupRegions: Rows = uniqueBy(
    csv.version_group_regions.map((r) => ({
      versionGroupId: Number(r.version_group_id),
      regionId: Number(r.region_id),
    })),
    (r) => `${r.versionGroupId}-${r.regionId}`,
  );

  const versionNames = localized(csv.version_names, "version_id");
  const versions: Rows = csv.versions.map((v) => ({
    id: Number(v.id),
    slug: v.identifier,
    versionGroupId: Number(v.version_group_id),
    nameFr: VERSION_LABELS_FR[v.identifier] ?? versionNames.fr(v.id, v.identifier),
    nameEn: versionNames.en(v.id, v.identifier),
  }));

  const pokedexNames = localized(csv.pokedex_prose, "pokedex_id", "name");
  const pokedexDescriptions = localized(csv.pokedex_prose, "pokedex_id", "description");
  const pokedexes: Rows = csv.pokedexes.map((d) => ({
    id: Number(d.id),
    slug: d.identifier,
    isMainSeries: bool(d.is_main_series),
    regionId: int(d.region_id),
    nameFr: pokedexNames.fr(d.id, d.identifier),
    nameEn: pokedexNames.en(d.id, d.identifier),
    descriptionFr: pokedexDescriptions.fr(d.id, "") || null,
  }));
  const pokedexVersionGroups: Rows = uniqueBy(
    csv.pokedex_version_groups.map((r) => ({
      pokedexId: Number(r.pokedex_id),
      versionGroupId: Number(r.version_group_id),
    })),
    (r) => `${r.pokedexId}-${r.versionGroupId}`,
  );
  const pokedexEntries: Rows = uniqueBy(
    csv.pokemon_dex_numbers.map((r) => ({
      pokedexId: Number(r.pokedex_id),
      speciesId: Number(r.species_id),
      number: Number(r.pokedex_number),
    })),
    (r) => `${r.pokedexId}-${r.speciesId}`,
  );

  const speciesNames = localized(csv.pokemon_species_names, "pokemon_species_id", "name");
  const speciesGenus = localized(csv.pokemon_species_names, "pokemon_species_id", "genus");
  const species: Rows = csv.pokemon_species.map((s) => ({
    id: Number(s.id),
    slug: s.identifier,
    nameFr: speciesNames.fr(s.id, s.identifier),
    nameEn: speciesNames.en(s.id, s.identifier),
    genusFr: speciesGenus.fr(s.id, "") || null,
    generationId: Number(s.generation_id),
    isLegendary: bool(s.is_legendary),
    isMythical: bool(s.is_mythical),
    isBaby: bool(s.is_baby),
    captureRate: int(s.capture_rate),
    evolutionChainId: int(s.evolution_chain_id),
  }));

  // Types par forme (slot 1 / slot 2).
  const typesByPokemon = new Map<string, { 1?: number; 2?: number }>();
  for (const row of csv.pokemon_types) {
    const entry = typesByPokemon.get(row.pokemon_id) ?? {};
    entry[row.slot === "1" ? 1 : 2] = Number(row.type_id);
    typesByPokemon.set(row.pokemon_id, entry);
  }
  // Nom de forme FR : via la forme par défaut de chaque pokemon (pokemon_forms → pokemon_form_names).
  const formNames = localized(csv.pokemon_form_names, "pokemon_form_id", "form_name");
  const formNameByPokemon = new Map<string, string>();
  for (const form of csv.pokemon_forms) {
    if (!bool(form.is_default)) continue;
    const name = formNames.fr(form.id, "");
    if (name) formNameByPokemon.set(form.pokemon_id, name);
  }
  const pokemons: Rows = csv.pokemon.map((p) => {
    const pokemonTypes = typesByPokemon.get(p.id);
    if (!pokemonTypes?.[1]) throw new Error(`Pokémon ${p.identifier} (${p.id}) sans type`);
    return {
      id: Number(p.id),
      speciesId: Number(p.species_id),
      slug: p.identifier,
      isDefault: bool(p.is_default),
      formNameFr: formNameByPokemon.get(p.id) ?? null,
      type1Id: pokemonTypes[1],
      type2Id: pokemonTypes[2] ?? null,
      height: int(p.height),
      weight: int(p.weight),
    };
  });

  const locationNames = localized(csv.location_names, "location_id");
  const locations: Rows = csv.locations.map((l) => ({
    id: Number(l.id),
    slug: l.identifier,
    regionId: int(l.region_id),
    nameFr: locationNames.fr(l.id, l.identifier),
    nameEn: locationNames.en(l.id, l.identifier),
  }));
  const areaNames = localized(csv.location_area_prose, "location_area_id");
  const locationAreas: Rows = csv.location_areas.map((a) => ({
    id: Number(a.id),
    locationId: Number(a.location_id),
    slug: a.identifier || null,
    nameFr: areaNames.fr(a.id, "") || null,
    nameEn: areaNames.en(a.id, "") || null,
  }));

  const methodNames = localized(csv.encounter_method_prose, "encounter_method_id");
  const encounterMethods: Rows = csv.encounter_methods.map((m) => ({
    id: Number(m.id),
    slug: m.identifier,
    nameFr: METHOD_LABELS_FR[m.identifier] ?? methodNames.fr(m.id, m.identifier),
    nameEn: methodNames.en(m.id, m.identifier),
    order: Number(m.order),
  }));
  const conditionNames = localized(csv.encounter_condition_prose, "encounter_condition_id");
  const encounterConditions: Rows = csv.encounter_conditions.map((c) => ({
    id: Number(c.id),
    slug: c.identifier,
    nameFr: conditionNames.fr(c.id, c.identifier),
    nameEn: conditionNames.en(c.id, c.identifier),
  }));
  const conditionValueNames = localized(csv.encounter_condition_value_prose, "encounter_condition_value_id");
  const encounterConditionValues: Rows = csv.encounter_condition_values.map((v) => ({
    id: Number(v.id),
    conditionId: Number(v.encounter_condition_id),
    slug: v.identifier,
    nameFr: conditionValueNames.fr(v.id, v.identifier),
    nameEn: conditionValueNames.en(v.id, v.identifier),
    isDefault: bool(v.is_default),
  }));

  // Un slot = méthode + numéro + rareté (%) pour un groupe de versions.
  const slots = new Map(
    csv.encounter_slots.map((s) => [
      s.id,
      { methodId: Number(s.encounter_method_id), slot: int(s.slot), rarity: Number(s.rarity) },
    ]),
  );
  const encounters: Rows = csv.encounters.map((e) => {
    const slot = slots.get(e.encounter_slot_id);
    if (!slot) throw new Error(`Rencontre ${e.id} : slot ${e.encounter_slot_id} inconnu`);
    return {
      id: Number(e.id),
      source: "pokeapi",
      sourceRef: Number(e.id),
      versionId: Number(e.version_id),
      locationAreaId: Number(e.location_area_id),
      pokemonId: Number(e.pokemon_id),
      methodId: slot.methodId,
      slot: slot.slot,
      rarity: slot.rarity,
      minLevel: Number(e.min_level),
      maxLevel: Number(e.max_level),
    };
  });
  const encounterConditionLinks: Rows = uniqueBy(
    csv.encounter_condition_value_map.map((r) => ({
      encounterId: Number(r.encounter_id),
      conditionValueId: Number(r.encounter_condition_value_id),
    })),
    (r) => `${r.encounterId}-${r.conditionValueId}`,
  );
  const areaRates: Rows = uniqueBy(
    csv.location_area_encounter_rates.map((r) => ({
      locationAreaId: Number(r.location_area_id),
      methodId: Number(r.encounter_method_id),
      versionId: Number(r.version_id),
      rate: Number(r.rate),
    })),
    (r) => `${r.locationAreaId}-${r.methodId}-${r.versionId}`,
  );

  // Couverture par jeu : nombre de rencontres et de zones distinctes.
  const stats = new Map<number, { encounters: number; areas: Set<number> }>();
  for (const e of encounters) {
    const versionId = e.versionId as number;
    const entry = stats.get(versionId) ?? { encounters: 0, areas: new Set<number>() };
    entry.encounters++;
    entry.areas.add(e.locationAreaId as number);
    stats.set(versionId, entry);
  }
  const versionCoverage: Rows = versions.map((v) => {
    const entry = stats.get(v.id as number);
    const encounterCount = entry?.encounters ?? 0;
    const { status, note } = coverageFor(v.slug as string, encounterCount);
    return {
      versionId: v.id,
      status,
      encounterCount,
      areaCount: entry?.areas.size ?? 0,
      source: encounterCount > 0 ? "pokeapi" : null,
      note,
    };
  });

  return {
    generations, regions, types, versionGroups, versionGroupRegions, versions,
    pokedexes, pokedexVersionGroups, pokedexEntries, species, pokemons,
    locations, locationAreas, encounterMethods, encounterConditions, encounterConditionValues,
    encounters, encounterConditionLinks, areaRates, versionCoverage,
  };
}

type Data = ReturnType<typeof transform>;

// ---------------------------------------------------------------------------
// Chargement en base
// ---------------------------------------------------------------------------

async function load(client: pg.PoolClient, data: Data) {
  const step = async (label: string, fn: () => Promise<void>) => {
    const start = Date.now();
    await fn();
    console.log(`  ${label.padEnd(34)} ${((Date.now() - start) / 1000).toFixed(1)}s`);
  };
  const byId = { conflictKeys: ["id"] };

  await client.query("BEGIN");
  try {
    // Dimensions : upsert, dans l'ordre des clés étrangères.
    await step(`Generation (${data.generations.length})`, () => insertRows(client, "Generation", data.generations, byId));
    await step(`Region (${data.regions.length})`, () => insertRows(client, "Region", data.regions, byId));
    await step(`Type (${data.types.length})`, () => insertRows(client, "Type", data.types, byId));
    await step(`VersionGroup (${data.versionGroups.length})`, () => insertRows(client, "VersionGroup", data.versionGroups, byId));
    await step(`Version (${data.versions.length})`, () => insertRows(client, "Version", data.versions, byId));
    await step(`Pokedex (${data.pokedexes.length})`, () => insertRows(client, "Pokedex", data.pokedexes, byId));
    await step(`Species (${data.species.length})`, () => insertRows(client, "Species", data.species, byId));
    await step(`Pokemon (${data.pokemons.length})`, () => insertRows(client, "Pokemon", data.pokemons, byId));
    await step(`Location (${data.locations.length})`, () => insertRows(client, "Location", data.locations, byId));
    await step(`LocationArea (${data.locationAreas.length})`, () => insertRows(client, "LocationArea", data.locationAreas, byId));
    await step(`EncounterMethod (${data.encounterMethods.length})`, () => insertRows(client, "EncounterMethod", data.encounterMethods, byId));
    await step(`EncounterCondition (${data.encounterConditions.length})`, () => insertRows(client, "EncounterCondition", data.encounterConditions, byId));
    await step(`EncounterConditionValue (${data.encounterConditionValues.length})`, () => insertRows(client, "EncounterConditionValue", data.encounterConditionValues, byId));

    // Faits : on vide puis on recharge (aucune donnée utilisateur ne pointe dessus).
    await step("Purge des tables de faits", async () => {
      await client.query(`DELETE FROM "Encounter" WHERE "source" = 'pokeapi'`);
      await client.query(`DELETE FROM "LocationAreaEncounterRate"`);
      await client.query(`DELETE FROM "PokedexEntry"`);
      await client.query(`DELETE FROM "PokedexVersionGroup"`);
      await client.query(`DELETE FROM "VersionGroupRegion"`);
    });
    await step(`VersionGroupRegion (${data.versionGroupRegions.length})`, () => insertRows(client, "VersionGroupRegion", data.versionGroupRegions));
    await step(`PokedexVersionGroup (${data.pokedexVersionGroups.length})`, () => insertRows(client, "PokedexVersionGroup", data.pokedexVersionGroups));
    await step(`PokedexEntry (${data.pokedexEntries.length})`, () => insertRows(client, "PokedexEntry", data.pokedexEntries));
    await step(`LocationAreaEncounterRate (${data.areaRates.length})`, () => insertRows(client, "LocationAreaEncounterRate", data.areaRates));
    await step(`Encounter (${data.encounters.length})`, () => insertRows(client, "Encounter", data.encounters));
    await step(`EncounterConditionOnEncounter (${data.encounterConditionLinks.length})`, () =>
      insertRows(client, "EncounterConditionOnEncounter", data.encounterConditionLinks),
    );
    // Les ids PokeAPI sont insérés explicitement : on réaligne la séquence pour les sources futures.
    await client.query(
      `SELECT setval(pg_get_serial_sequence('"Encounter"', 'id'), COALESCE((SELECT MAX("id") FROM "Encounter"), 1))`,
    );

    await step(`VersionCoverage (${data.versionCoverage.length})`, () =>
      insertRows(client, "VersionCoverage", data.versionCoverage, {
        conflictKeys: ["versionId"],
        casts: { status: `"CoverageStatus"` },
      }),
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Vérification : les critères de la phase 1 du ROADMAP
// ---------------------------------------------------------------------------

async function verify(client: pg.PoolClient) {
  console.log("\nVérification — Route 101 dans Rubis :");
  const route101 = await client.query<{
    pokemon: string; method: string; minLevel: number; maxLevel: number; rate: number;
  }>(`
    SELECT s."nameFr" AS pokemon, m."nameFr" AS method,
           MIN(e."minLevel") AS "minLevel", MAX(e."maxLevel") AS "maxLevel", SUM(e."rarity")::int AS rate
    FROM "Encounter" e
    JOIN "Version" v ON v."id" = e."versionId"
    JOIN "LocationArea" a ON a."id" = e."locationAreaId"
    JOIN "Location" l ON l."id" = a."locationId"
    JOIN "Pokemon" p ON p."id" = e."pokemonId"
    JOIN "Species" s ON s."id" = p."speciesId"
    JOIN "EncounterMethod" m ON m."id" = e."methodId"
    WHERE v."slug" = 'ruby' AND l."slug" = 'hoenn-route-101'
    GROUP BY s."nameFr", m."nameFr", m."order"
    ORDER BY m."order", rate DESC
  `);
  for (const row of route101.rows) {
    const level = row.minLevel === row.maxLevel ? `niv. ${row.minLevel}` : `niv. ${row.minLevel}-${row.maxLevel}`;
    console.log(`  ${row.pokemon.padEnd(12)} ${row.method.padEnd(24)} ${level.padEnd(10)} ${String(row.rate).padStart(3)} %`);
  }

  const paldea = await client.query<{ count: string }>(
    `SELECT COUNT(*) FROM "PokedexEntry" pe JOIN "Pokedex" d ON d."id" = pe."pokedexId" WHERE d."slug" = 'paldea'`,
  );
  console.log(`\nPokédex de Paldea : ${paldea.rows[0].count} entrées (attendu : 400)`);

  const coverage = await client.query<{ nameFr: string; status: string; encounterCount: number; areaCount: number }>(`
    SELECT v."nameFr", c."status", c."encounterCount", c."areaCount"
    FROM "VersionCoverage" c JOIN "Version" v ON v."id" = c."versionId"
    ORDER BY v."id"
  `);
  console.log("\nCouverture des rencontres par jeu :");
  for (const row of coverage.rows) {
    console.log(`  ${row.nameFr.padEnd(28)} ${row.status.padEnd(8)} ${String(row.encounterCount).padStart(6)} rencontres, ${String(row.areaCount).padStart(3)} zones`);
  }
}

// ---------------------------------------------------------------------------

async function main() {
  const start = Date.now();
  console.log(`Chargement des CSV PokeAPI${options.refresh ? " (re-téléchargement)" : ""}…`);
  const csv = await loadAllCsv();
  const data = transform(csv);
  console.log(`  ${data.species.length} espèces, ${data.pokemons.length} formes, ${data.locations.length} lieux, ${data.encounters.length} rencontres`);

  const pool = createPool();
  const client = await pool.connect();
  try {
    if (!options.spritesOnly) {
      console.log("\nImport en base…");
      await load(client, data);
      await verify(client);
    }
  } finally {
    client.release();
    await pool.end();
  }

  if (!options.skipSprites) {
    console.log("\nTéléchargement des sprites…");
    await downloadSprites(data.pokemons.map((p) => p.id as number));
  }

  console.log(`\nTerminé en ${((Date.now() - start) / 1000).toFixed(0)}s.`);
}

main().catch((error) => {
  console.error("\nÉchec de l'import :", error);
  process.exit(1);
});
