"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, CloseIcon, SearchIcon } from "@/components/icons";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { ToolbarSelect } from "@/components/toolbar-select";
import { cardLink, ghostButton, input } from "@/components/ui";
import type { TeamOption, TypeRef } from "@/lib/data/team";
import { normalize } from "@/lib/search";

type Props = {
  /** Emplacement à remplir (0 à 5). */
  slot: number;
  gameName: string;
  options: TeamOption[];
  types: TypeRef[];
  /** Formes déjà dans l'équipe, marquées d'une coche. */
  inTeam: Set<number>;
  onPick: (pokemonId: number) => void;
  onClose: () => void;
};

/**
 * Fenêtre modale (`<dialog>`) listant les Pokémon disponibles dans le jeu, avec recherche et filtre
 * par type. Montée à l'ouverture, démontée à la fermeture : la recherche repart de zéro à chaque fois.
 */
export function TeamPicker({ slot, gameName, options, types, inTeam, onPick, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | null>(null);

  useEffect(() => {
    dialog.current?.showModal();
    // Sur mobile, on n'ouvre pas le clavier d'office : il cacherait la liste.
    if (window.matchMedia("(pointer: fine)").matches) search.current?.focus();
  }, []);

  const shown = useMemo(() => {
    const needle = normalize(query);
    return options.filter((o) => (!type || o.types.some((t) => t.slug === type)) && (!needle || normalize(o.nameFr).includes(needle)));
  }, [options, query, type]);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      // Un clic sur le voile (hors de la boîte) ferme la fenêtre.
      onClick={(event) => event.target === event.currentTarget && dialog.current?.close()}
      aria-labelledby="team-picker-title"
      className="m-auto h-[min(88dvh,760px)] w-[calc(100%-24px)] max-w-3xl flex-col overflow-hidden rounded-lg border border-line bg-surface p-0 text-ink shadow-float backdrop:bg-scrim open:flex"
    >
      <div className="space-y-3 border-b border-line p-4 sm:px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <p className="t-caption">Emplacement {slot + 1}</p>
            <h2 id="team-picker-title" className="t-h2">
              Pokémon de {gameName}
            </h2>
          </div>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Fermer" className={`${ghostButton} -mr-2 size-10 px-0`}>
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="relative min-w-0 flex-1">
            <SearchIcon size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
            <input
              ref={search}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom du Pokémon…"
              aria-label="Chercher un Pokémon"
              autoComplete="off"
              className={`${input} h-10 rounded-full border-line pl-9 text-sm`}
            />
          </div>
          <ToolbarSelect
            label="Type"
            value={type ?? ""}
            onChange={(slug) => setType(slug || null)}
            options={types.map((t) => ({ value: t.slug, label: t.nameFr }))}
            placeholder="Tous"
            highlight={type !== null}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {shown.length === 0 ? (
          <p className="p-2 text-ink-2">Aucun Pokémon ne correspond.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {shown.map((option) => {
              const picked = inTeam.has(option.pokemonId);
              return (
                <li key={option.pokemonId}>
                  <button
                    type="button"
                    onClick={() => onPick(option.pokemonId)}
                    className={`${cardLink} relative flex h-full w-full flex-col items-center gap-1 px-2 pt-2 pb-3 text-center`}
                  >
                    <PokemonSprite pokemonId={option.pokemonId} fallbackId={option.speciesId} alt="" size={80} className="size-16 sm:size-20" />
                    <span className="text-[13px] leading-4 font-semibold text-balance">{option.nameFr}</span>
                    <span className="mt-auto flex gap-1 pt-1" aria-label={option.types.map((t) => t.nameFr).join(" · ")}>
                      {option.types.map((t) => (
                        <span key={t.slug} aria-hidden className="size-2 rounded-full" style={{ background: `var(--type-${t.slug}, var(--type-unknown))` }} />
                      ))}
                    </span>
                    {picked && (
                      <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-ink text-on-ink" title="Déjà dans l'équipe">
                        <CheckIcon size={12} />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </dialog>
  );
}
