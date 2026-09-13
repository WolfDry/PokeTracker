import { auth } from "@/lib/auth";
import { setHuntCount } from "@/lib/data/shiny";
import { MAX_HUNT_COUNT } from "@/lib/shiny";

/**
 * Sauvegarde de dernier recours du compteur d'une chasse, envoyée par `navigator.sendBeacon`
 * quand l'onglet passe en arrière-plan ou se ferme avant que la Server Action n'ait pu partir
 * (console en main, on verrouille le téléphone juste après avoir tapé +1).
 * Corps : formulaire `huntId=…&count=…`.
 */
export async function POST(request: Request) {
  // Beacon strictement même origine : pas de POST depuis un autre site.
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return new Response(null, { status: 403 });

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response(null, { status: 401 });

  const form = await request.formData().catch(() => null);
  const huntId = form?.get("huntId");
  const count = Number(form?.get("count"));
  if (typeof huntId !== "string" || !Number.isInteger(count) || count < 0 || count > MAX_HUNT_COUNT) {
    return new Response(null, { status: 400 });
  }

  const saved = await setHuntCount(session.user.id, huntId, count);
  return new Response(null, { status: saved ? 204 : 404 });
}
