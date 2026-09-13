import { revalidateTag } from "next/cache";

/**
 * Invalide toutes les données de référence mises en cache (`cacheTag("reference")`),
 * à appeler après `npm run import:data`.
 *
 *   curl -X POST http://localhost:3000/api/revalidate
 *   curl -X POST -H "Authorization: Bearer $REVALIDATE_SECRET" https://…/api/revalidate
 *
 * En production, `REVALIDATE_SECRET` est obligatoire ; en développement, l'appel est libre.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret) return Response.json({ ok: false, error: "REVALIDATE_SECRET non configuré" }, { status: 503 });
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return Response.json({ ok: false, error: "Non autorisé" }, { status: 401 });
    }
  }
  // { expire: 0 } : la prochaine requête recharge les données au lieu de servir l'ancienne version.
  revalidateTag("reference", { expire: 0 });
  return Response.json({ ok: true, revalidated: "reference", at: new Date().toISOString() });
}
