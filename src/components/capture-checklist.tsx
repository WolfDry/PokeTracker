"use client";

import Link from "next/link";
import { useState } from "react";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { ProgressBar } from "@/components/progress-bar";
import { useCaptures } from "@/components/use-captures";
import type { SpeciesLocation } from "@/lib/data/encounters";
import type { PokedexGridEntry } from "@/lib/data/pokedex";

export type ChecklistEntry = PokedexGridEntry & { locations: SpeciesLocation[] };

type Props = {
  versionId: number;
  entries: ChecklistEntry[];
  captured: number[];
  /** Message si PokeAPI n'a pas les rencontres de ce jeu. */
  coverageNote: string | null;
};

const MAX_LOCATIONS = 3;

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-sm transition-colors ${
    active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card hover:border-accent"
  }`;

const formatLevel = (min: number, max: number) => (min === max ? `Niv. ${min}` : `Niv. ${min}–${max}`);

/** Liste des Pokémon d'un Pokédex avec où les trouver dans ce jeu, cochables. */
export function CaptureChecklist({ versionId, entries, captured, coverageNote }: Props) {
  const captures = useCaptures(versionId, captured);
  const [tab, setTab] = useState<"missing" | "caught">("missing");

  const caughtCount = entries.filter((e) => captures.captured.has(e.species.id)).length;
  const shown = entries.filter((e) => captures.captured.has(e.species.id) === (tab === "caught"));

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border border-border bg-card p-3">
        <ProgressBar caught={caughtCount} total={entries.length} label="Attrapés" />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Afficher">
          <button type="button" className={chip(tab === "missing")} aria-pressed={tab === "missing"} onClick={() => setTab("missing")}>
            Manquants ({entries.length - caughtCount})
          </button>
          <button type="button" className={chip(tab === "caught")} aria-pressed={tab === "caught"} onClick={() => setTab("caught")}>
            Attrapés ({caughtCount})
          </button>
          {captures.error && (
            <span role="alert" className="ml-auto text-sm text-accent">
              {captures.error}
            </span>
          )}
        </div>
        {coverageNote && <p className="text-xs text-muted">{coverageNote}</p>}
      </div>

      {shown.length === 0 ? (
        <p className="text-muted">{tab === "missing" ? "Pokédex complet, bravo !" : "Aucun Pokémon attrapé pour l'instant."}</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {shown.map((entry) => {
            const caught = captures.captured.has(entry.species.id);
            const extra = entry.locations.length - MAX_LOCATIONS;
            return (
              <li key={entry.species.id} className="flex items-start gap-3 px-3 py-2">
                <button
                  type="button"
                  onClick={() => captures.toggle(entry.species.id)}
                  aria-pressed={caught}
                  aria-label={`${caught ? "Retirer" : "Marquer"} ${entry.species.nameFr} ${caught ? "des captures" : "comme attrapé"}`}
                  className={`mt-2.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs sm:mt-3 sm:size-6 transition-colors ${
                    caught ? "border-emerald-500 bg-emerald-500 text-white" : "border-border bg-background text-transparent hover:border-emerald-500 hover:text-emerald-500"
                  }`}
                >
                  ✓
                </button>
                <PokemonSprite pokemonId={entry.species.pokemonId} alt="" size={48} className="shrink-0" />
                <div className="min-w-0 flex-1 py-1">
                  <Link href={`/pokemon/${entry.species.id}`} className="font-medium hover:text-accent">
                    <span className="mr-2 text-xs font-normal text-muted">N° {String(entry.number).padStart(3, "0")}</span>
                    {entry.species.nameFr}
                  </Link>
                  {entry.locations.length === 0 ? (
                    <p className="text-sm text-muted">
                      {coverageNote ? "Lieux inconnus pour ce jeu." : "Pas de rencontre sauvage connue : évolution, échange, cadeau ou événement."}
                    </p>
                  ) : (
                    <ul className="text-sm">
                      {entry.locations.slice(0, MAX_LOCATIONS).map((location) => (
                        <li key={location.id} className="flex flex-wrap items-baseline gap-x-2">
                          <Link href={`/rencontres/${location.versionSlug}/${location.slug}`} className="underline decoration-border hover:text-accent">
                            {location.nameFr}
                          </Link>
                          <span className="text-muted">
                            {location.methods.join(", ")} · {formatLevel(location.minLevel, location.maxLevel)}
                          </span>
                        </li>
                      ))}
                      {extra > 0 && (
                        <li>
                          <Link href={`/pokemon/${entry.species.id}`} className="text-muted underline hover:text-foreground">
                            + {extra} autre{extra > 1 ? "s" : ""} lieu{extra > 1 ? "x" : ""}
                          </Link>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
