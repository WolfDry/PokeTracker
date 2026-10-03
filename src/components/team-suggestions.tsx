"use client";

import { useMemo, useState } from "react";
import { PlusIcon } from "@/components/icons";
import { SectionHeader } from "@/components/page-header";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { TypeBadge } from "@/components/type-badge";
import { card, notice, secondaryButton, smallButton, spriteBox, textLink } from "@/components/ui";
import type { TeamBuilderData, TeamOption } from "@/lib/data/team";
import { analyzeDefense, formatFactor, suggestMembers, teamWeaknesses } from "@/lib/team";

type Props = {
  data: Pick<TeamBuilderData, "types" | "chart" | "options" | "game">;
  team: (TeamOption | null)[];
  /** Ajoute la forme au premier emplacement libre. */
  onAdd: (pokemonId: number) => void;
};

const MAX_ALTERNATIVES = 3;

/** Pokémon du jeu qui combleraient les points faibles de l'équipe, avec ce à quoi ils résistent. */
export function TeamSuggestions({ data, team, onAdd }: Props) {
  const [legendary, setLegendary] = useState(false);
  const full = team.every((member) => member !== null);
  const suggestions = useMemo(() => (full ? [] : suggestMembers(data, team, data.options, { legendary })), [data, team, full, legendary]);
  const hasWeaknesses = teamWeaknesses(analyzeDefense(data, team)).length > 0;

  return (
    <section className="space-y-4" aria-labelledby="team-suggestions">
      <SectionHeader
        title={<span id="team-suggestions">Suggestions</span>}
        aside={
          !full && (
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={legendary} onChange={(event) => setLegendary(event.target.checked)} className="size-4 accent-[var(--ink)]" />
              Légendaires et fabuleux
            </label>
          )
        }
      />
      {full ? (
        <p className={notice}>Équipe complète : retire un membre pour voir qui comblerait ses points faibles.</p>
      ) : suggestions.length === 0 ? (
        <p className={notice}>
          {hasWeaknesses
            ? `Aucun Pokémon de ${data.game.nameFr} ne réduit ces points faibles sans en ajouter d'autres.`
            : "Aucun point faible à combler : chaque faiblesse de l'équipe est compensée par une résistance."}
        </p>
      ) : (
        <>
          <p className="t-small text-ink-2">
            Pokémon de {data.game.nameFr} qui résistent aux points faibles de l&apos;équipe sans en ajouter, un par combinaison de types.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map(({ option, alternatives, resists, covers }) => (
              <li key={option.pokemonId} className={`${card} flex flex-col gap-3 p-4`}>
                <div className="flex items-center gap-3">
                  <span className={`${spriteBox} size-16`}>
                    <PokemonSprite pokemonId={option.pokemonId} fallbackId={option.speciesId} alt="" size={56} />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="leading-5 font-bold text-balance">{option.nameFr}</p>
                    <div className="flex flex-wrap gap-1">
                      {option.types.map((t) => (
                        <TypeBadge key={t.slug} type={t} />
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAdd(option.pokemonId)}
                    aria-label={`Ajouter ${option.nameFr} à l'équipe`}
                    className={`${secondaryButton} ${smallButton} shrink-0`}
                  >
                    <PlusIcon size={14} /> Ajouter
                  </button>
                </div>
                <dl className="space-y-2 t-small">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <dt className="mr-1 t-caption">Résiste</dt>
                    {resists.map(({ type, factor }) => (
                      <dd key={type.slug} className="inline-flex items-center gap-1">
                        <TypeBadge type={type} />
                        <span className="font-semibold text-success">{formatFactor(factor)}</span>
                      </dd>
                    ))}
                  </div>
                  {covers.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <dt className="mr-1 t-caption">Couvre</dt>
                      {covers.map((type) => (
                        <dd key={type.slug}>
                          <TypeBadge type={type} />
                        </dd>
                      ))}
                    </div>
                  )}
                  {alternatives.length > 0 && (
                    <div className="flex flex-wrap items-baseline gap-x-1.5">
                      <dt className="mr-1 t-caption">Aussi</dt>
                      {alternatives.slice(0, MAX_ALTERNATIVES).map((alt, index) => (
                        <dd key={alt.pokemonId}>
                          <button type="button" onClick={() => onAdd(alt.pokemonId)} title={`Ajouter ${alt.nameFr} à l'équipe`} className={textLink}>
                            {alt.nameFr}
                          </button>
                          {index < Math.min(alternatives.length, MAX_ALTERNATIVES) - 1 && ","}
                        </dd>
                      ))}
                      {alternatives.length > MAX_ALTERNATIVES && <dd className="text-ink-3">+ {alternatives.length - MAX_ALTERNATIVES}</dd>}
                    </div>
                  )}
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
