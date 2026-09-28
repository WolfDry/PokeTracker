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
import { bool, humanize, int, loadCsv, localized, uniqueBy, type Row } from "./csv";
import { createPool, insertRows, type Rows } from "./db";
import { evolutionConditionFr, formConditionFr } from "./evolutions";
import { conditionValueLabelFr, LOCATION_LABELS_FR, METHOD_LABELS_FR, VERSION_LABELS_FR } from "./labels";
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
  "types", "type_names", "type_efficacy", "type_efficacy_past",
  "version_groups", "version_group_regions",
  "versions", "version_names",
  "pokedexes", "pokedex_prose", "pokedex_version_groups", "pokemon_dex_numbers",
  "pokemon_species", "pokemon_species_names",
  "pokemon", "pokemon_types", "pokemon_types_past", "pokemon_forms", "pokemon_form_names", "pokemon_stats", "stats",
  "pokemon_evolution", "evolution_triggers", "evolution_trigger_prose", "items", "item_names", "move_names",
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

  // Table des types par génération. PokeAPI donne la table actuelle, plus les valeurs d'avant un
  // changement (valables jusqu'à leur génération incluse) : on reconstruit la table de chaque génération.
  // Seuls les 18 types de combat (ni Stellaire, ni « ??? », ni Obscur) et ceux déjà apparus.
  const typeGeneration = new Map(csv.types.map((t) => [t.id, Number(t.generation_id)]));
  const isBattleType = (id: string) => Number(id) <= 18;
  const pastEfficacy = new Map<string, { factor: number; generationId: number }[]>();
  for (const row of csv.type_efficacy_past) {
    const key = `${row.damage_type_id}-${row.target_type_id}`;
    pastEfficacy.set(key, [...(pastEfficacy.get(key) ?? []), { factor: Number(row.damage_factor), generationId: Number(row.generation_id) }]);
  }
  const typeEfficacy: Rows = csv.generations.flatMap((g) => {
    const generationId = Number(g.id);
    const exists = (id: string) => isBattleType(id) && (typeGeneration.get(id) ?? Infinity) <= generationId;
    return csv.type_efficacy
      .filter((row) => exists(row.damage_type_id) && exists(row.target_type_id))
      .map((row) => {
        const past = (pastEfficacy.get(`${row.damage_type_id}-${row.target_type_id}`) ?? [])
          .filter((p) => p.generationId >= generationId)
          .sort((a, b) => a.generationId - b.generationId)[0];
        return {
          generationId,
          attackTypeId: Number(row.damage_type_id),
          defenseTypeId: Number(row.target_type_id),
          factor: past?.factor ?? Number(row.damage_factor),
        };
      });
  });

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
    evolvesFromSpeciesId: int(s.evolves_from_species_id),
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
  const fullFormNames = localized(csv.pokemon_form_names, "pokemon_form_id", "pokemon_name");
  const formNameByPokemon = new Map<string, string>();
  const fullNameByPokemon = new Map<string, string>();
  const defaultFormByPokemon = new Map<string, Row>();
  for (const form of csv.pokemon_forms) {
    if (!bool(form.is_default)) continue;
    defaultFormByPokemon.set(form.pokemon_id, form);
    const name = formNames.fr(form.id, "");
    if (name) formNameByPokemon.set(form.pokemon_id, name);
    const fullName = fullFormNames.frOnly(form.id);
    if (fullName) fullNameByPokemon.set(form.pokemon_id, fullName);
  }
  // Stats de base : une ligne par (pokemon, stat), les stats 1–6 sont PV, Atq, Déf, Atq. Spé., Déf. Spé., Vit.
  const STAT_COLUMNS: Record<string, string> = {
    hp: "hp", attack: "attack", defense: "defense",
    "special-attack": "specialAttack", "special-defense": "specialDefense", speed: "speed",
  };
  const statSlugById = new Map(csv.stats.map((s) => [s.id, s.identifier]));
  const statsByPokemon = new Map<string, Record<string, number>>();
  for (const row of csv.pokemon_stats) {
    const column = STAT_COLUMNS[statSlugById.get(row.stat_id) ?? ""];
    if (!column) continue;
    const entry = statsByPokemon.get(row.pokemon_id) ?? {};
    entry[column] = Number(row.base_stat);
    statsByPokemon.set(row.pokemon_id, entry);
  }
  const itemNames = localized(csv.item_names, "item_id");
  const itemIdBySlug = new Map(csv.items.map((i) => [i.identifier, i.id]));
  const itemFrBySlug = (slug: string) => {
    const id = itemIdBySlug.get(slug);
    return id ? itemNames.fr(id, slug) : undefined;
  };
  const speciesSlugById = new Map(csv.pokemon_species.map((s) => [s.id, s.identifier]));
  const pokemons: Rows = csv.pokemon.map((p) => {
    const pokemonTypes = typesByPokemon.get(p.id);
    if (!pokemonTypes?.[1]) throw new Error(`Pokémon ${p.identifier} (${p.id}) sans type`);
    const isDefault = bool(p.is_default);
    const stats = statsByPokemon.get(p.id) ?? {};
    const form = defaultFormByPokemon.get(p.id);
    return {
      id: Number(p.id),
      speciesId: Number(p.species_id),
      slug: p.identifier,
      isDefault,
      nameFr: isDefault ? null : (fullNameByPokemon.get(p.id) ?? null),
      formNameFr: formNameByPokemon.get(p.id) ?? null,
      formConditionFr: isDefault ? null : formConditionFr(p.identifier, speciesSlugById.get(p.species_id) ?? "", itemFrBySlug),
      isBattleOnly: bool(form?.is_battle_only),
      introducedVersionGroupId: int(form?.introduced_in_version_group_id),
      type1Id: pokemonTypes[1],
      type2Id: pokemonTypes[2] ?? null,
      height: int(p.height),
      weight: int(p.weight),
      hp: stats.hp ?? null,
      attack: stats.attack ?? null,
      defense: stats.defense ?? null,
      specialAttack: stats.specialAttack ?? null,
      specialDefense: stats.specialDefense ?? null,
      speed: stats.speed ?? null,
    };
  });

  // Types d'avant un changement (Mélofée Normal jusqu'en 5e génération), une ligne par (forme, génération).
  const pastTypes = new Map<string, Record<string, number | null>>();
  for (const row of csv.pokemon_types_past) {
    const key = `${row.pokemon_id}-${row.generation_id}`;
    const entry = pastTypes.get(key) ?? { pokemonId: Number(row.pokemon_id), generationId: Number(row.generation_id), type1Id: null, type2Id: null };
    entry[row.slot === "1" ? "type1Id" : "type2Id"] = Number(row.type_id);
    pastTypes.set(key, entry);
  }
  const pokemonPastTypes: Rows = [...pastTypes.values()];

  const locationNames = localized(csv.location_names, "location_id");
  const locations: Rows = csv.locations.map((l) => ({
    id: Number(l.id),
    slug: l.identifier,
    regionId: int(l.region_id),
    nameFr: LOCATION_LABELS_FR[l.identifier] ?? locationNames.fr(l.id, humanize(l.identifier)),
    nameEn: locationNames.en(l.id, humanize(l.identifier)),
  }));
  const areaNames = localized(csv.location_area_prose, "location_area_id");
  const locationById = new Map(locations.map((l) => [l.id as number, l]));
  const locationAreas: Rows = csv.location_areas.map((a) => {
    const location = locationById.get(Number(a.location_id));
    const nameEn = areaNames.en(a.id, "") || null;
    let nameFr = areaNames.frOnly(a.id) ?? null;
    // Sans nom français, PokeAPI ne fournit que "<lieu EN> (Max Den A)" : on reconstruit à partir du lieu en français.
    if (!nameFr && nameEn && location && nameEn.startsWith(location.nameEn as string)) {
      nameFr = (location.nameFr as string) + nameEn.slice((location.nameEn as string).length).replace("Max Den", "Antre Dynamax");
    }
    return {
      id: Number(a.id),
      locationId: Number(a.location_id),
      slug: a.identifier || null,
      nameFr: nameFr ?? nameEn,
      nameEn,
    };
  });

  // Conditions d'évolution en français, une ligne par façon d'obtenir l'espèce.
  const triggerSlugById = new Map(csv.evolution_triggers.map((t) => [t.id, t.identifier]));
  const triggerNames = localized(csv.evolution_trigger_prose, "evolution_trigger_id");
  const moveNames = localized(csv.move_names, "move_id");
  const speciesNameById = new Map(species.map((s) => [String(s.id), s.nameFr as string]));
  const typeNameById = new Map(types.map((t) => [String(t.id), t.nameFr as string]));
  const locationNameById = new Map(locations.map((l) => [String(l.id), l.nameFr as string]));
  const evolutionLookups = {
    triggerSlug: (id: string) => triggerSlugById.get(id) ?? "other",
    triggerFr: (id: string) => triggerNames.fr(id, "Autre"),
    itemFr: (id: string) => itemNames.fr(id, "Objet"),
    moveFr: (id: string) => moveNames.fr(id, "une capacité"),
    typeFr: (id: string) => typeNameById.get(id) ?? "",
    speciesFr: (id: string) => speciesNameById.get(id) ?? "",
    locationFr: (id: string) => locationNameById.get(id) ?? "",
  };
  const evolutions: Rows = csv.pokemon_evolution.map((e) => ({
    id: Number(e.id),
    evolvedSpeciesId: Number(e.evolved_species_id),
    triggerSlug: evolutionLookups.triggerSlug(e.evolution_trigger_id),
    conditionFr: evolutionConditionFr(e, evolutionLookups),
    isDefault: e.is_default === undefined || bool(e.is_default),
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
  const speciesNameBySlug = new Map(species.map((s) => [s.slug as string, s.nameFr as string]));
  const encounterConditionValues: Rows = csv.encounter_condition_values.map((v) => ({
    id: Number(v.id),
    conditionId: Number(v.encounter_condition_id),
    slug: v.identifier,
    // Notre libellé, sinon celui de PokeAPI en français, sinon par motif, sinon l'anglais.
    nameFr:
      conditionValueLabelFr(v.identifier, conditionValueNames.frOnly(v.id), (slug) => speciesNameBySlug.get(slug)) ??
      conditionValueNames.en(v.id, v.identifier),
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
    generations, regions, types, typeEfficacy, versionGroups, versionGroupRegions, versions,
    pokedexes, pokedexVersionGroups, pokedexEntries, species, pokemons, pokemonPastTypes, evolutions,
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
      await client.query(`DELETE FROM "Evolution"`);
      await client.query(`DELETE FROM "TypeEfficacy"`);
      await client.query(`DELETE FROM "PokemonPastType"`);
    });
    await step(`TypeEfficacy (${data.typeEfficacy.length})`, () => insertRows(client, "TypeEfficacy", data.typeEfficacy));
    await step(`PokemonPastType (${data.pokemonPastTypes.length})`, () => insertRows(client, "PokemonPastType", data.pokemonPastTypes));
    await step(`Evolution (${data.evolutions.length})`, () => insertRows(client, "Evolution", data.evolutions));
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
