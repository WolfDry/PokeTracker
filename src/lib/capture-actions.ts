"use server";

import { setCapture } from "@/lib/data/captures";
import { getCurrentUser } from "@/lib/session";

export type CaptureActionResult = { ok: true } | { ok: false; error: string };

/** Coche / décoche un Pokémon dans un jeu pour l'utilisateur connecté. L'UI est optimiste : le résultat sert à annuler en cas d'échec. */
export async function toggleCaptureAction(versionId: number, speciesId: number, captured: boolean): Promise<CaptureActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Connecte-toi pour cocher tes captures." };
  if (!Number.isInteger(versionId) || !Number.isInteger(speciesId) || typeof captured !== "boolean") {
    return { ok: false, error: "Requête invalide." };
  }
  try {
    await setCapture(user.id, versionId, speciesId, captured);
    return { ok: true };
  } catch (error) {
    // Jeu ou espèce inconnus (clé étrangère), base indisponible…
    console.error("[captures]", error);
    return { ok: false, error: "Impossible d'enregistrer pour le moment." };
  }
}
