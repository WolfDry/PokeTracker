"use client";

import { useCallback, useState, useTransition } from "react";
import { toggleCaptureAction } from "@/lib/capture-actions";

/**
 * État « attrapé » d'un jeu côté client, mis à jour de façon optimiste :
 * la case change tout de suite, et revient en arrière si le serveur refuse.
 */
export function useCaptures(versionId: number, initial: number[]) {
  const [captured, setCaptured] = useState(() => new Set(initial));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const setOne = (speciesId: number, value: boolean) =>
    setCaptured((current) => {
      const next = new Set(current);
      if (value) next.add(speciesId);
      else next.delete(speciesId);
      return next;
    });

  const toggle = useCallback(
    (speciesId: number) => {
      const value = !captured.has(speciesId);
      setOne(speciesId, value);
      setError(null);
      startTransition(async () => {
        const result = await toggleCaptureAction(versionId, speciesId, value);
        if (!result.ok) {
          setOne(speciesId, !value);
          setError(result.error);
        }
      });
    },
    [captured, versionId],
  );

  return { captured, toggle, error, pending };
}
