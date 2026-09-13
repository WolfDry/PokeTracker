import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

// Les CSV bruts du repo PokeAPI sont la source de vérité de leur base.
const CSV_BASE_URL = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/";
export const CSV_CACHE_DIR = path.resolve("data/cache/csv");

export type Row = Record<string, string>;

async function exists(file: string) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

/** Télécharge (ou relit depuis le cache) un CSV PokeAPI et le parse. */
export async function loadCsv(name: string, { refresh = false } = {}): Promise<Row[]> {
  await mkdir(CSV_CACHE_DIR, { recursive: true });
  const file = path.join(CSV_CACHE_DIR, `${name}.csv`);

  let text: string;
  if (!refresh && (await exists(file))) {
    text = await readFile(file, "utf8");
  } else {
    const response = await fetch(`${CSV_BASE_URL}${name}.csv`);
    if (!response.ok) {
      throw new Error(`Téléchargement de ${name}.csv impossible (HTTP ${response.status})`);
    }
    text = await response.text();
    await writeFile(file, text);
  }

  return parse(text, { columns: true, skip_empty_lines: true, trim: true, bom: true }) as Row[];
}

export const int = (value: string | undefined): number | null =>
  value === undefined || value === "" ? null : Number(value);

export const bool = (value: string | undefined) => value === "1";

/** "hoenn-pokecenter" → "Hoenn pokecenter" : repli lisible quand aucun nom n'existe. */
export const humanize = (slug: string) => {
  const text = slug.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const LANG = { fr: "5", en: "9" } as const;

/**
 * Accès aux libellés localisés d'une table *_names / *_prose.
 * `fr()` retombe sur l'anglais puis sur la valeur par défaut quand la traduction manque.
 */
export function localized(rows: Row[], idKey: string, nameKey = "name") {
  const fr = new Map<string, string>();
  const en = new Map<string, string>();
  for (const row of rows) {
    const value = row[nameKey];
    if (!value) continue;
    if (row.local_language_id === LANG.fr) fr.set(row[idKey], value);
    else if (row.local_language_id === LANG.en) en.set(row[idKey], value);
  }
  return {
    fr: (id: string, fallback: string) => fr.get(id) ?? en.get(id) ?? fallback,
    en: (id: string, fallback: string) => en.get(id) ?? fallback,
  };
}

/** Déduplique par clé : `ON CONFLICT DO UPDATE` refuse deux fois la même clé dans un INSERT. */
export function uniqueBy<T>(rows: T[], key: (row: T) => string): T[] {
  const seen = new Map<string, T>();
  for (const row of rows) seen.set(key(row), row);
  return [...seen.values()];
}
