import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/** Pages accessibles sans être connecté. */
const PUBLIC_PATHS = ["/connexion", "/inscription"];

/**
 * Connexion obligatoire : sans cookie de session, toute page renvoie vers la connexion,
 * avec retour sur la page demandée via `?next=`.
 *
 * Contrôle « optimiste » (présence du cookie, sans lecture en base) : la vérification sûre
 * reste dans la couche de session (`requireUser` / `getCurrentUser`) des pages et actions
 * qui touchent aux données de l'utilisateur.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return NextResponse.next();
  if (getSessionCookie(request)) return NextResponse.next();

  const url = new URL("/connexion", request.url);
  if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  // Hors routes d'API (elles répondent 401 elles-mêmes), fichiers internes de Next,
  // sprites et tout fichier avec extension (favicon, images de `public/`).
  matcher: ["/((?!api/|_next/static|_next/image|sprites/|.*\\.[^/]+$).*)"],
};
