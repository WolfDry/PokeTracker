"use client";

import { useState, useTransition } from "react";
import { CheckIcon } from "@/components/icons";
import { chip } from "@/components/ui";
import { toggleCaptureAction } from "@/lib/capture-actions";

type Version = { id: number; slug: string; nameFr: string };

type Props = {
  speciesId: number;
  /** Jeux où l'espèce figure dans un Pokédex, dans l'ordre des générations. */
  versions: Version[];
  /** Ids des jeux où elle est déjà cochée. */
  captured: number[];
};

/** Fiche Pokémon : une chip par jeu, cliquable pour cocher / décocher la capture (optimiste). */
export function SpeciesCaptureChips({ speciesId, versions, captured }: Props) {
  const [set, setSet] = useState(() => new Set(captured));
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const update = (versionId: number, value: boolean) =>
    setSet((current) => {
      const next = new Set(current);
      if (value) next.add(versionId);
      else next.delete(versionId);
      return next;
    });

  const toggle = (versionId: number) => {
    const value = !set.has(versionId);
    update(versionId, value);
    setError(null);
    startTransition(async () => {
      const result = await toggleCaptureAction(versionId, speciesId, value);
      if (!result.ok) {
        update(versionId, !value);
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap gap-2">
        {versions.map((version) => {
          const caught = set.has(version.id);
          return (
            <li key={version.id}>
              <button type="button" onClick={() => toggle(version.id)} aria-pressed={caught} className={chip(caught)}>
                {caught && <CheckIcon size={12} />}
                {version.nameFr}
              </button>
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
