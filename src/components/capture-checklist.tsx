"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon } from "@/components/icons";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { ProgressBar } from "@/components/progress-bar";
import { card, checkCircle, chip, chipCount, dexNumber, spriteBox, textLink } from "@/components/ui";
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

const formatLevel = (min: number, max: number) => (min === max ? `Niv. ${min}` : `Niv. ${min}–${max}`);

/** Liste des Pokémon d'un Pokédex avec où les trouver dans ce jeu, cochables. */
export function CaptureChecklist({ versionId, entries, captured, coverageNote }: Props) {
  const captures = useCaptures(versionId, captured);
  const [tab, setTab] = useState<"missing" | "caught">("missing");

  const caughtCount = entries.filter((e) => captures.captured.has(e.species.id)).length;
  const shown = entries.filter((e) => captures.captured.has(e.species.id) === (tab === "caught"));

  return (
    <div className="space-y-5">
      <div className={`${card} space-y-4 p-5`}>
        <ProgressBar caught={caughtCount} total={entries.length} label="Attrapés" />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Afficher">
          <button type="button" className={chip(tab === "missing")} aria-pressed={tab === "missing"} onClick={() => setTab("missing")}>
            Manquants <span className={chipCount(tab === "missing")}>{entries.length - caughtCount}</span>
          </button>
          <button type="button" className={chip(tab === "caught")} aria-pressed={tab === "caught"} onClick={() => setTab("caught")}>
            Attrapés <span className={chipCount(tab === "caught")}>{caughtCount}</span>
          </button>
          {captures.error && (
            <span role="alert" className="ml-auto t-small text-danger">
              {captures.error}
            </span>
          )}
        </div>
        {coverageNote && <p className="t-small text-ink-2">{coverageNote}</p>}
      </div>

      {shown.length === 0 ? (
        <p className="text-ink-2">{tab === "missing" ? "Pokédex complet, bravo !" : "Aucun Pokémon attrapé pour l'instant."}</p>
      ) : (
        <ul className={`${card} divide-y divide-line overflow-hidden`}>
          {shown.map((entry) => {
            const caught = captures.captured.has(entry.species.id);
            const extra = entry.locations.length - MAX_LOCATIONS;
            return (
              <li key={entry.species.id} className="flex items-start gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => captures.toggle(entry.species.id)}
                  aria-pressed={caught}
                  aria-label={`${caught ? "Retirer" : "Marquer"} ${entry.species.nameFr} ${caught ? "des captures" : "comme attrapé"}`}
                  className="-m-2 grid size-11 shrink-0 place-items-center self-center"
                >
                  <span className={checkCircle(caught)}>
                    <CheckIcon />
                  </span>
                </button>
                <span className={`${spriteBox} size-12 rounded-sm`}>
                  <PokemonSprite pokemonId={entry.species.pokemonId} alt="" size={48} />
                </span>
                <div className="min-w-0 flex-1 space-y-1 py-1">
                  <Link href={`/pokemon/${entry.species.id}`} className="flex items-baseline gap-2 font-semibold hover:underline">
                    <span className="t-small font-normal text-ink-3">{dexNumber(entry.number)}</span>
                    {entry.species.nameFr}
                  </Link>
                  {entry.locations.length === 0 ? (
                    <p className="t-small text-ink-2">
                      {coverageNote ? "Lieux inconnus pour ce jeu." : "Pas de rencontre sauvage connue : évolution, échange, cadeau ou événement."}
                    </p>
                  ) : (
                    <ul className="t-small">
                      {entry.locations.slice(0, MAX_LOCATIONS).map((location) => (
                        <li key={location.id} className="flex flex-wrap items-baseline gap-x-2">
                          <Link href={`/rencontres/${location.versionSlug}/${location.slug}`} className={textLink}>
                            {location.nameFr}
                          </Link>
                          <span className="text-ink-2">
                            {location.methods.join(", ")} · {formatLevel(location.minLevel, location.maxLevel)}
                          </span>
                        </li>
                      ))}
                      {extra > 0 && (
                        <li>
                          <Link href={`/pokemon/${entry.species.id}`} className={`${textLink} text-ink-2`}>
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
