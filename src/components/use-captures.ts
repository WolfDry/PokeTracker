"use client";

import { useCallback, useState, useTransition } from "react";
import { type CaptureActionResult, toggleCaptureAction, toggleFormCaptureAction } from "@/lib/capture-actions";

/** Server Action qui enregistre une coche : captures (par défaut) ou shiny dex. */
export type ToggleAction = (versionId: number, speciesId: number, value: boolean, pokemonId?: number) => Promise<CaptureActionResult>;

/**
 * État « attrapé » d'un jeu côté client, mis à jour de façon optimiste :
 * la case change tout de suite, et revient en arrière si le serveur refuse.
 */
export function useCaptures(versionId: number, initial: number[], action: ToggleAction = toggleCaptureAction) {
  const [captured, setCaptured] = useState(() => new Set(initial));
  const [error, setError] = useState<string | null>(null);
  // Changement de jeu sans remonter le composant : on repart des captures de ce jeu.
  const [currentVersion, setCurrentVersion] = useState(versionId);
  if (currentVersion !== versionId) {
    setCurrentVersion(versionId);
    setCaptured(new Set(initial));
    setError(null);
  }
  const [pending, startTransition] = useTransition();

  const setOne = (speciesId: number, value: boolean) =>
    setCaptured((current) => {
      const next = new Set(current);
      if (value) next.add(speciesId);
      else next.delete(speciesId);
      return next;
    });

  const toggle = useCallback(
    /** `pokemonId` : forme affichée, enregistrée par le shiny dex (les captures l'ignorent). */
    (speciesId: number, pokemonId?: number) => {
      const value = !captured.has(speciesId);
      setOne(speciesId, value);
      setError(null);
      startTransition(async () => {
        const result = await action(versionId, speciesId, value, pokemonId);
        if (!result.ok) {
          setOne(speciesId, !value);
          setError(result.error);
        }
      });
    },
    [captured, versionId, action],
  );

  return { captured, toggle, error, pending };
}

/** Formes cochées dans un jeu (« p10091 », « f10086 »), mises à jour de façon optimiste comme `useCaptures`. */
export function useFormCaptures(versionId: number, initial: string[]) {
  const [captured, setCaptured] = useState(() => new Set(initial));
  const [error, setError] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState(versionId);
  if (currentVersion !== versionId) {
    setCurrentVersion(versionId);
    setCaptured(new Set(initial));
    setError(null);
  }
  const [, startTransition] = useTransition();

  const setOne = (form: string, value: boolean) =>
    setCaptured((current) => {
      const next = new Set(current);
      if (value) next.add(form);
      else next.delete(form);
      return next;
    });

  const toggle = useCallback(
    (speciesId: number, form: string) => {
      const value = !captured.has(form);
      setOne(form, value);
      setError(null);
      startTransition(async () => {
        const result = await toggleFormCaptureAction(versionId, speciesId, form, value);
        if (!result.ok) {
          setOne(form, !value);
          setError(result.error);
        }
      });
    },
    [captured, versionId],
  );

  return { captured, toggle, error };
}
