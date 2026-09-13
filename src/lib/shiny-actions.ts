"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { searchSpecies, type SpeciesPick } from "@/lib/data/search";
import {
  completeHunt,
  createHunt,
  createShiny,
  deleteHunt,
  deleteShiny,
  setHuntCount,
  setHuntStatus,
} from "@/lib/data/shiny";
import { getCurrentUser } from "@/lib/session";
import { MAX_HUNT_COUNT } from "@/lib/shiny";

// Server Actions des chasses shiny. Les formulaires (nouvelle chasse, clôture, ajout manuel)
// passent par useActionState ; le compteur appelle `setHuntCountAction` avec un délai.

export type ShinyField = "speciesId" | "versionId" | "method" | "count" | "encounters" | "nickname" | "note" | "caughtAt";

export type ShinyFormState = {
  error?: string;
  fieldErrors?: Partial<Record<ShinyField, string>>;
  /** Valeurs à réafficher après une erreur. */
  values?: Partial<Record<ShinyField, string>>;
};

export type ShinyActionResult = { ok: true } | { ok: false; error: string };

const NOT_SIGNED_IN = "Connecte-toi pour gérer tes chasses shiny.";
const NOT_FOUND = "Chasse introuvable, ou déjà terminée.";
const FAILED = "Impossible d'enregistrer pour le moment.";

const blankToNull = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);
const DAY = 24 * 60 * 60 * 1000;

/** Identifiant obligatoire ("" ou absent → 0 → refusé). */
const requiredId = (error: string) => z.coerce.number({ error }).int({ error }).positive({ error });
/** Compteur facultatif : vide → null, sinon entier dans [0, MAX_HUNT_COUNT]. */
const optionalCount = z.preprocess(
  blankToNull,
  z.coerce
    .number({ error: "Un nombre entier." })
    .int({ error: "Un nombre entier." })
    .min(0, { error: "Pas de nombre négatif." })
    .max(MAX_HUNT_COUNT, { error: `Au plus ${MAX_HUNT_COUNT.toLocaleString("fr-FR")}.` })
    .nullable(),
);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Au plus ${max} caractères.` })
    .transform((value) => value || null);

const speciesId = requiredId("Choisis un Pokémon dans la liste.");
const versionId = requiredId("Choisis un jeu.");
const method = optionalText(60);
const nickname = optionalText(40);
const note = optionalText(500);
// <input type="date"> : "2026-09-14" ; vide → maintenant.
const caughtAt = z.preprocess(
  (value) => blankToNull(value) ?? new Date(),
  z.coerce.date({ error: "Date invalide." }).refine((date) => date.getTime() <= Date.now() + DAY, { error: "La date est dans le futur." }),
);

const huntSchema = z.object({ speciesId, versionId, method, count: optionalCount });
const completeSchema = z.object({ huntId: z.string().min(1), count: optionalCount, nickname, note, caughtAt });
const shinySchema = z.object({ speciesId, versionId, method, encounters: optionalCount, nickname, note, caughtAt });

function fieldErrors(error: z.ZodError): Partial<Record<ShinyField, string>> {
  const flat = z.flattenError(error).fieldErrors as Partial<Record<ShinyField, string[]>>;
  return Object.fromEntries(Object.entries(flat).map(([field, messages]) => [field, messages?.[0]]));
}

/** Valeurs saisies telles quelles, pour les réafficher après une erreur. */
function values(formData: FormData, fields: ShinyField[]): Partial<Record<ShinyField, string>> {
  return Object.fromEntries(fields.map((field) => [field, String(formData.get(field) ?? "")]));
}

function isForeignKeyError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2003";
}

/** Suggestions d'espèces pour le champ « Pokémon » des formulaires. */
export async function searchSpeciesAction(query: string): Promise<SpeciesPick[]> {
  if (typeof query !== "string") return [];
  return searchSpecies(query.slice(0, 50));
}

export async function createHuntAction(_prev: ShinyFormState, formData: FormData): Promise<ShinyFormState> {
  const fields: ShinyField[] = ["speciesId", "versionId", "method", "count"];
  const user = await getCurrentUser();
  if (!user) return { error: NOT_SIGNED_IN, values: values(formData, fields) };

  const parsed = huntSchema.safeParse(Object.fromEntries(fields.map((f) => [f, formData.get(f)])));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: values(formData, fields) };

  let huntId: string;
  try {
    const { speciesId, versionId, method, count } = parsed.data;
    huntId = (await createHunt(user.id, { speciesId, versionId, method, count: count ?? 0 })).id;
  } catch (error) {
    console.error("[shiny]", error);
    return { error: isForeignKeyError(error) ? "Pokémon ou jeu inconnu." : FAILED, values: values(formData, fields) };
  }
  redirect(`/shiny/chasse/${huntId}`);
}

/** Enregistre le compteur d'une chasse (valeur absolue, envoyée après un court délai par le client). */
export async function setHuntCountAction(huntId: string, count: number): Promise<ShinyActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };
  if (typeof huntId !== "string" || !Number.isInteger(count) || count < 0 || count > MAX_HUNT_COUNT) {
    return { ok: false, error: "Requête invalide." };
  }
  try {
    return (await setHuntCount(user.id, huntId, count)) ? { ok: true } : { ok: false, error: NOT_FOUND };
  } catch (error) {
    console.error("[shiny]", error);
    return { ok: false, error: FAILED };
  }
}

export async function completeHuntAction(_prev: ShinyFormState, formData: FormData): Promise<ShinyFormState> {
  const fields: ShinyField[] = ["count", "nickname", "note", "caughtAt"];
  const user = await getCurrentUser();
  if (!user) return { error: NOT_SIGNED_IN, values: values(formData, fields) };

  const parsed = completeSchema.safeParse({ huntId: formData.get("huntId"), ...Object.fromEntries(fields.map((f) => [f, formData.get(f)])) });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: values(formData, fields) };

  try {
    const { huntId, ...data } = parsed.data;
    const shiny = await completeHunt(user.id, huntId, data);
    if (!shiny) return { error: NOT_FOUND, values: values(formData, fields) };
  } catch (error) {
    console.error("[shiny]", error);
    return { error: FAILED, values: values(formData, fields) };
  }
  redirect("/shiny/galerie");
}

/** Met une chasse en pause (elle reste listée, reprenable). */
export async function pauseHuntAction(huntId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=%2Fshiny");
  await setHuntStatus(user.id, huntId, "ABANDONED");
  refresh();
}

export async function resumeHuntAction(huntId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=%2Fshiny");
  await setHuntStatus(user.id, huntId, "ACTIVE");
  refresh();
}

export async function deleteHuntAction(huntId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=%2Fshiny");
  await deleteHunt(user.id, huntId);
  redirect("/shiny");
}

/** Ajout d'un shiny sans chasse (full odds, œuf, échange…). */
export async function addShinyAction(_prev: ShinyFormState, formData: FormData): Promise<ShinyFormState> {
  const fields: ShinyField[] = ["speciesId", "versionId", "method", "encounters", "nickname", "note", "caughtAt"];
  const user = await getCurrentUser();
  if (!user) return { error: NOT_SIGNED_IN, values: values(formData, fields) };

  const parsed = shinySchema.safeParse(Object.fromEntries(fields.map((f) => [f, formData.get(f)])));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: values(formData, fields) };

  try {
    await createShiny(user.id, parsed.data);
  } catch (error) {
    console.error("[shiny]", error);
    return { error: isForeignKeyError(error) ? "Pokémon ou jeu inconnu." : FAILED, values: values(formData, fields) };
  }
  redirect("/shiny/galerie");
}

export async function deleteShinyAction(shinyId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=%2Fshiny%2Fgalerie");
  await deleteShiny(user.id, shinyId);
  refresh();
}
