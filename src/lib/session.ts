import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

// Couche d'accès à la session (« Data Access Layer ») : tout ce qui a besoin de l'utilisateur
// courant passe par ici. Lecture à la requête → toujours derrière un <Suspense> avec Cache Components.

export type CurrentUser = { id: string; name: string; email: string; createdAt: Date };

/** Utilisateur connecté, ou `null`. Dédupliqué par requête grâce à `cache`. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Les cookies posés pendant une Server Action (connexion, pseudo modifié…) ne sont pas dans
  // l'en-tête `cookie` brut de la requête : on le reconstruit depuis `cookies()`, qui les voit.
  const requestHeaders = new Headers(await headers());
  requestHeaders.set("cookie", (await cookies()).toString());
  const result = await auth.api.getSession({ headers: requestHeaders });
  if (!result) return null;
  const { id, name, email, createdAt } = result.user;
  return { id, name, email, createdAt };
});

/** Utilisateur connecté, sinon redirection vers la connexion avec retour sur `next`. */
export async function requireUser(next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  return user;
}

/** N'accepte que des chemins internes (« /captures »), jamais une URL externe ou protocol-relative. */
export function safeNext(value: unknown, fallback = "/") {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
