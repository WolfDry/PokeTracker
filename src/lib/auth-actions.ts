"use server";

import { APIError } from "better-auth/api";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { safeNext } from "@/lib/session";

// Server Actions d'authentification : les formulaires fonctionnent sans JavaScript et
// les cookies sont posés par le plugin `nextCookies` de Better Auth.

export type AuthField = "name" | "email" | "password" | "confirm";

export type AuthFormState = {
  /** Erreur globale (identifiants invalides, e-mail déjà utilisé…). */
  error?: string;
  fieldErrors?: Partial<Record<AuthField, string>>;
  /** Valeurs à réafficher après une erreur (jamais le mot de passe). */
  values?: { name?: string; email?: string };
  success?: boolean;
};

const email = z.email({ error: "Adresse e-mail invalide." }).max(254, { error: "Adresse e-mail trop longue." });
const password = z
  .string()
  .min(8, { error: "Au moins 8 caractères." })
  .max(128, { error: "Au plus 128 caractères." });
const name = z
  .string()
  .trim()
  .min(2, { error: "Au moins 2 caractères." })
  .max(40, { error: "Au plus 40 caractères." });

const signUpSchema = z
  .object({ name, email, password, confirm: z.string(), next: z.string().optional() })
  .refine((data) => data.password === data.confirm, { error: "Les deux mots de passe ne correspondent pas.", path: ["confirm"] });

const signInSchema = z.object({ email, password: z.string().min(1, { error: "Mot de passe requis." }), next: z.string().optional() });

const nameSchema = z.object({ name });

/** Messages français pour les codes d'erreur de Better Auth. */
const ERROR_MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS: "Un compte existe déjà avec cette adresse e-mail.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Un compte existe déjà avec cette adresse e-mail.",
  INVALID_EMAIL_OR_PASSWORD: "Adresse e-mail ou mot de passe incorrect.",
  INVALID_EMAIL: "Adresse e-mail invalide.",
  INVALID_PASSWORD: "Mot de passe invalide.",
  PASSWORD_TOO_SHORT: "Mot de passe trop court (8 caractères minimum).",
  PASSWORD_TOO_LONG: "Mot de passe trop long.",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Adresse e-mail ou mot de passe incorrect.",
  SESSION_EXPIRED: "Ta session a expiré, reconnecte-toi.",
};

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof APIError) {
    const code = (error.body as { code?: string } | undefined)?.code;
    if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
    console.error("[auth] erreur Better Auth non traduite :", code, error.message);
    return fallback;
  }
  console.error("[auth]", error);
  return fallback;
}

/** Erreurs par champ d'un échec de validation Zod, prêtes pour le formulaire. */
function fieldErrors(error: z.ZodError): Partial<Record<AuthField, string>> {
  const flat = z.flattenError(error).fieldErrors as Partial<Record<AuthField, string[]>>;
  return Object.fromEntries(Object.entries(flat).map(([field, messages]) => [field, messages?.[0]]));
}

const field = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const input = {
    name: field(formData, "name"),
    email: field(formData, "email").trim().toLowerCase(),
    password: field(formData, "password"),
    confirm: field(formData, "confirm"),
    next: field(formData, "next"),
  };
  const values = { name: input.name, email: input.email };
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  try {
    await auth.api.signUpEmail({
      body: { name: parsed.data.name, email: parsed.data.email, password: parsed.data.password },
      headers: await headers(),
    });
  } catch (error) {
    return { error: errorMessage(error, "Impossible de créer le compte pour le moment."), values };
  }
  redirect(safeNext(parsed.data.next, "/compte"));
}

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const input = { email: field(formData, "email").trim().toLowerCase(), password: field(formData, "password"), next: field(formData, "next") };
  const values = { email: input.email };
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  try {
    await auth.api.signInEmail({
      body: { email: parsed.data.email, password: parsed.data.password },
      headers: await headers(),
    });
  } catch (error) {
    return { error: errorMessage(error, "Connexion impossible pour le moment."), values };
  }
  redirect(safeNext(parsed.data.next, "/compte"));
}

export async function signOutAction() {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (error) {
    // Session déjà expirée ou cookie absent : on renvoie quand même à l'accueil.
    console.error("[auth] déconnexion :", error);
  }
  redirect("/");
}

export async function updateNameAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = nameSchema.safeParse({ name: field(formData, "name") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    await auth.api.updateUser({ body: { name: parsed.data.name }, headers: await headers() });
  } catch (error) {
    return { error: errorMessage(error, "Impossible de modifier le nom pour le moment.") };
  }
  // Le nom apparaît dans l'en-tête : on rafraîchit l'arbre serveur sans toucher aux caches.
  refresh();
  return { success: true, values: { name: parsed.data.name } };
}
