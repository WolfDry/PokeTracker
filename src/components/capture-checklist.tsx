"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, EyeIcon, EyeOffIcon } from "@/components/icons";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { ProgressBar } from "@/components/progress-bar";
import { card, checkCircle, chip, chipCount, dexNumber, spriteBox, textLink } from "@/components/ui";
import { useCaptures } from "@/components/use-captures";
import { SpoilerSprite } from "@/components/spoiler-sprite";
import { useSpoilerStore } from "@/store/spoiler-store";
import type { SpeciesLocation } from "@/lib/data/encounters";
import type { PokedexGridEntry } from "@/lib/data/pokedex";
import type { ShinyDexMeta } from "@/lib/data/shiny";
import { toggleShinyAction } from "@/lib/shiny-actions";

export type ChecklistEntry = PokedexGridEntry & { locations: SpeciesLocation[] };

type Props = {
  /** Jeu où cocher ; `null` = dex National, en lecture seule (on coche dans chaque jeu). */
  versionId: number | null;
  entries: ChecklistEntry[];
  captured: number[];
  /** Message si PokeAPI n'a pas les rencontres de ce jeu. */
  coverageNote: string | null;
  /** National : jeux où chaque espèce est attrapée, affichés à la place des lieux. */
  caughtIn?: Record<number, string[]>;
  /** Shiny dex : sprites chromatiques, coches enregistrées comme shinies, chasses en cours. */
  shiny?: { gameSlug: string; meta: Record<number, ShinyDexMeta> };
};

const MAX_LOCATIONS = 3;

const numberFr = new Intl.NumberFormat("fr-FR");
const formatLevel = (min: number, max: number) => (min === max ? `Niv. ${min}` : `Niv. ${min}–${max}`);

/** Liste des Pokémon d'un Pokédex avec où les trouver dans ce jeu, cochables (ou, au National, où ils sont attrapés). */
export function CaptureChecklist({ versionId, entries, captured, coverageNote, caughtIn, shiny }: Props) {
  const readOnly = versionId === null;
  const captures = useCaptures(versionId ?? 0, captured, shiny ? toggleShinyAction : undefined);
  const spoilers = useSpoilerStore();
  const [tab, setTab] = useState<"missing" | "caught">("missing");
  const caughtLabel = shiny ? "Obtenus" : "Attrapés";

  const caughtCount = entries.filter((e) => captures.captured.has(e.species.id)).length;
  const shown = entries.filter((e) => captures.captured.has(e.species.id) === (tab === "caught"));

  const toggle = (entry: ChecklistEntry) => {
    const meta = shiny?.meta[entry.species.id];
    // Décocher un shiny supprime ses fiches (et la chasse dont il vient) : on confirme s'il y a de quoi perdre.
    if (shiny && captures.captured.has(entry.species.id) && meta?.detailed) {
      const many = meta.count > 1;
      const message = `Supprimer ${many ? `les ${meta.count} shinies` : "le shiny"} de ${entry.species.nameFr} de ce jeu, avec ${many ? "leurs chasses et leurs détails" : "sa chasse et ses détails"} ?`;
      if (!window.confirm(message)) return;
    }
    captures.toggle(entry.species.id);
  };

  return (
    <div className="space-y-5">
      <div className={`${card} space-y-4 p-5`}>
        <ProgressBar caught={caughtCount} total={entries.length} label={caughtLabel} />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Afficher">
          <button type="button" className={chip(tab === "missing")} aria-pressed={tab === "missing"} onClick={() => setTab("missing")}>
            Manquants <span className={chipCount(tab === "missing")}>{entries.length - caughtCount}</span>
          </button>
          <button type="button" className={chip(tab === "caught")} aria-pressed={tab === "caught"} onClick={() => setTab("caught")}>
            {caughtLabel} <span className={chipCount(tab === "caught")}>{caughtCount}</span>
          </button>
          {shiny && (
            <button
              type="button"
              className={chip(spoilers.shinyRevealed)}
              aria-pressed={spoilers.shinyRevealed}
              onClick={spoilers.toggleShinyRevealed}
              title={spoilers.shinyRevealed ? "Afficher les manquants en couleurs normales" : "Afficher les manquants en shiny"}
            >
              {spoilers.shinyRevealed ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
              Spoilers
            </button>
          )}
          {captures.error && (
            <span role="alert" className="ml-auto t-small text-danger">
              {captures.error}
            </span>
          )}
        </div>
        {coverageNote && <p className="t-small text-ink-2">{coverageNote}</p>}
      </div>

      {shown.length === 0 ? (
        <p className="text-ink-2">
          {tab === "missing" ? `${shiny ? "Shiny dex" : "Pokédex"} complet, bravo !` : shiny ? "Aucun shiny obtenu pour l'instant." : "Aucun Pokémon attrapé pour l'instant."}
        </p>
      ) : (
        <ul className={`${card} divide-y divide-line overflow-hidden`}>
          {shown.map((entry) => {
            const caught = captures.captured.has(entry.species.id);
            const meta = shiny?.meta[entry.species.id];
            const extra = entry.locations.length - MAX_LOCATIONS;
            return (
              <li key={entry.species.id} className="flex items-start gap-3 px-4 py-3">
                {readOnly ? (
                  <span className="-m-2 grid size-11 shrink-0 place-items-center self-center">
                    <span className={`${checkCircle(caught)} pointer-events-none`}>
                      <CheckIcon />
                    </span>
                    <span className="sr-only">{caught ? (shiny ? "Obtenu" : "Attrapé") : "Manquant"}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggle(entry)}
                    aria-pressed={caught}
                    aria-label={
                      shiny
                        ? `${caught ? "Retirer" : "Marquer"} ${entry.species.nameFr} ${caught ? "des shinies" : "comme obtenu en shiny"}`
                        : `${caught ? "Retirer" : "Marquer"} ${entry.species.nameFr} ${caught ? "des captures" : "comme attrapé"}`
                    }
                    className="-m-2 grid size-11 shrink-0 place-items-center self-center"
                  >
                    <span className={checkCircle(caught)}>
                      <CheckIcon />
                    </span>
                  </button>
                )}
                <span className={`${spriteBox} size-12 rounded-sm`}>
                  {/* Mode spoiler : un shiny manquant garde son sprite normal tant qu'il n'est pas révélé. */}
                  {shiny && !caught ? (
                    <SpoilerSprite pokemonId={entry.species.pokemonId} fallbackId={entry.species.id} alt="" size={48} />
                  ) : (
                    <PokemonSprite pokemonId={entry.species.pokemonId} fallbackId={entry.species.id} alt="" size={48} shiny={Boolean(shiny)} />
                  )}
                </span>
                <div className="min-w-0 flex-1 space-y-1 py-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <Link href={`/pokemon/${entry.species.id}`} className="flex items-baseline gap-2 font-semibold hover:underline">
                      <span className="t-small font-normal text-ink-3">{dexNumber(entry.number)}</span>
                      {entry.species.nameFr}
                    </Link>
                    {shiny && caught && meta && meta.count > 1 && <span className="t-small text-ink-2">×{meta.count}</span>}
                    {shiny && !readOnly && !caught && (
                      <ShinyHuntLink gameSlug={shiny.gameSlug} speciesId={entry.species.id} hunt={meta?.hunt ?? null} />
                    )}
                  </div>
                  {readOnly ? (
                    <p className="t-small text-ink-2">
                      {caught
                        ? `${shiny ? "Obtenu" : "Attrapé"} dans : ${caughtIn?.[entry.species.id]?.join(", ") ?? "—"}`
                        : shiny
                          ? "Pas encore obtenu en shiny."
                          : "Pas encore attrapé dans un jeu."}
                    </p>
                  ) : entry.locations.length === 0 ? (
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

/** Shiny manquant : sa chasse en cours, ou de quoi en lancer une, jeu et espèce préremplis. */
function ShinyHuntLink({ gameSlug, speciesId, hunt }: { gameSlug: string; speciesId: number; hunt: ShinyDexMeta["hunt"] }) {
  const className = "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold transition-colors";
  return hunt ? (
    <Link href={`/shiny/chasse/${hunt.id}`} className={`${className} bg-game-soft text-game-text hover:bg-game-line`}>
      Chasse en cours · {numberFr.format(hunt.count)}
    </Link>
  ) : (
    <Link href={`/shiny/nouvelle?jeu=${gameSlug}&espece=${speciesId}`} className={`${className} border border-line text-ink-2 hover:border-line-strong hover:text-ink`}>
      Chasser
    </Link>
  );
}
