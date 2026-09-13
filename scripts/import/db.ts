import pg from "pg";

export type Value = string | number | boolean | null;
export type Rows = Record<string, Value>[];

// Limite Postgres : 65 535 paramètres par requête. On reste large.
const MAX_PARAMS = 30_000;

const quote = (identifier: string) => `"${identifier}"`;

export function createPool() {
  // L'import passe par la connexion directe : le pooler Neon n'aime pas les longues transactions.
  const connectionString = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DIRECT_DATABASE_URL (ou DATABASE_URL) manquant dans les variables d'environnement");
  }
  return new pg.Pool({ connectionString, max: 1 });
}

type InsertOptions = {
  /** Colonnes de la clé de conflit : active un upsert (`ON CONFLICT DO UPDATE`). */
  conflictKeys?: string[];
  /** Casts SQL par colonne, nécessaires pour les enums Postgres (ex. `"CoverageStatus"`). */
  casts?: Record<string, string>;
};

/**
 * INSERT multi-lignes par lots. Toutes les lignes doivent avoir les mêmes clés,
 * qui sont les noms de colonnes de la table Prisma (noms de champs = noms de colonnes).
 */
export async function insertRows(
  client: pg.PoolClient,
  table: string,
  rows: Rows,
  { conflictKeys, casts }: InsertOptions = {},
) {
  if (rows.length === 0) return;

  const columns = Object.keys(rows[0]);
  const perBatch = Math.max(1, Math.floor(MAX_PARAMS / columns.length));

  let onConflict = "";
  if (conflictKeys) {
    const keys = conflictKeys.map(quote).join(", ");
    const updatable = columns.filter((column) => !conflictKeys.includes(column));
    onConflict =
      updatable.length === 0
        ? ` ON CONFLICT (${keys}) DO NOTHING`
        : ` ON CONFLICT (${keys}) DO UPDATE SET ${updatable
            .map((column) => `${quote(column)} = EXCLUDED.${quote(column)}`)
            .join(", ")}`;
  }

  for (let offset = 0; offset < rows.length; offset += perBatch) {
    const batch = rows.slice(offset, offset + perBatch);
    const params: Value[] = [];
    const tuples = batch.map((row) => {
      const placeholders = columns.map((column) => {
        params.push(row[column] ?? null);
        const placeholder = `$${params.length}`;
        const cast = casts?.[column];
        return cast ? `${placeholder}::${cast}` : placeholder;
      });
      return `(${placeholders.join(", ")})`;
    });

    await client.query(
      `INSERT INTO ${quote(table)} (${columns.map(quote).join(", ")}) VALUES ${tuples.join(", ")}${onConflict}`,
      params,
    );
  }
}
