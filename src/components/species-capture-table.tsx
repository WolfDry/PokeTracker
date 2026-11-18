"use client";

import { useState, useTransition } from "react";
import { CheckIcon } from "@/components/icons";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { card } from "@/components/ui";
import { toggleCaptureAction, toggleFormCaptureAction } from "@/lib/capture-actions";
import type { CapturableForm } from "@/lib/forms";

type Version = { id: number; slug: string; nameFr: string };

type Props = {
  speciesId: number;
  speciesName: string;
  /** Forme par défaut : sprite et nom (« Motif Floraison »), à défaut « Forme de base ». */
  base: { pokemonId: number; nameFr: string | null };
  /** Jeux où l'espèce figure, dans l'ordre des générations. */
  versions: Version[];
  forms: CapturableForm[];
  /** Rang de groupe de versions de chaque jeu : une forme pas encore sortie n'y est pas cochable. */
  orders: Record<number, number>;
  /** Jeux où l'espèce est cochée. */
  captured: number[];
  /** Formes cochées, jeu par jeu. */
  capturedForms: { versionId: number; form: string }[];
};

const cellKey = (versionId: number, form: string) => `${versionId}:${form}`;

/**
 * Fiche Pokémon d'une espèce à formes (Prismillon, Zarbi…) : une ligne par forme, une colonne par jeu, chaque case
 * cochable. La première ligne est l'espèce elle-même, comptée dans le living dex.
 */
export function SpeciesCaptureTable({ speciesId, speciesName, base, versions, forms, orders, captured, capturedForms }: Props) {
  const [species, setSpecies] = useState(() => new Set(captured));
  const [cells, setCells] = useState(() => new Set(capturedForms.map((c) => cellKey(c.versionId, c.form))));
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const flip = <T,>(set: (update: (current: Set<T>) => Set<T>) => void, item: T, value: boolean) =>
    set((current) => {
      const next = new Set(current);
      if (value) next.add(item);
      else next.delete(item);
      return next;
    });

  const toggleSpecies = (versionId: number) => {
    const value = !species.has(versionId);
    flip(setSpecies, versionId, value);
    setError(null);
    startTransition(async () => {
      const result = await toggleCaptureAction(versionId, speciesId, value);
      if (!result.ok) {
        flip(setSpecies, versionId, !value);
        setError(result.error);
      }
    });
  };

  const toggleForm = (versionId: number, form: string) => {
    const key = cellKey(versionId, form);
    const value = !cells.has(key);
    flip(setCells, key, value);
    setError(null);
    startTransition(async () => {
      const result = await toggleFormCaptureAction(versionId, speciesId, form, value);
      if (!result.ok) {
        flip(setCells, key, !value);
        setError(result.error);
      }
    });
  };

  const rows = [
    { key: "base", pokemonId: base.pokemonId, spriteForm: null, nameFr: base.nameFr ?? "Forme de base", introducedOrder: 0 },
    ...forms.map((f) => ({ ...f, nameFr: f.nameFr.startsWith(`${speciesName} `) ? f.nameFr.slice(speciesName.length + 1) : f.nameFr })),
  ];

  return (
    <div className="space-y-2">
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="text-left text-xs font-semibold text-ink-3">
            <tr>
              <th className="sticky left-0 bg-surface px-3 py-2.5 tracking-[0.06em] uppercase">Forme</th>
              {versions.map((version) => (
                <th key={version.id} className="min-w-16 px-1.5 py-2.5 text-center leading-4 font-semibold">
                  {version.nameFr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-line">
                <th scope="row" className="sticky left-0 bg-surface px-3 py-1 text-left font-medium">
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <PokemonSprite pokemonId={row.pokemonId} form={row.spriteForm} alt="" size={32} className="size-8 shrink-0 object-contain" />
                    {row.nameFr}
                  </span>
                </th>
                {versions.map((version) => {
                  const available = row.introducedOrder <= (orders[version.id] ?? 0);
                  if (!available) {
                    return (
                      <td key={version.id} className="px-1.5 py-1 text-center text-ink-3" title={`Pas encore dans ${version.nameFr}`}>
                        —
                      </td>
                    );
                  }
                  const caught = row.key === "base" ? species.has(version.id) : cells.has(cellKey(version.id, row.key));
                  return (
                    <td key={version.id} className="px-1.5 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => (row.key === "base" ? toggleSpecies(version.id) : toggleForm(version.id, row.key))}
                        aria-pressed={caught}
                        aria-label={`${row.nameFr} dans ${version.nameFr}`}
                        className={`inline-grid size-7 place-items-center rounded-full border transition-colors ${
                          caught ? "border-ink bg-ink text-on-ink" : "border-line-strong bg-surface hover:border-ink"
                        }`}
                      >
                        {caught && <CheckIcon size={14} strokeWidth={2.5} />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
