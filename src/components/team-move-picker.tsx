"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, CloseIcon, SearchIcon } from "@/components/icons";
import { ToolbarSelect } from "@/components/toolbar-select";
import { TypeBadge } from "@/components/type-badge";
import { checkCircle, ghostButton, input, primaryButton } from "@/components/ui";
import { CATEGORY_LABELS, type LearnableMove, learnMethodLabel, MAX_MOVES, type TeamMove, toTeamMove } from "@/lib/moves";
import { normalize } from "@/lib/search";
import { learnableMovesAction } from "@/lib/team-actions";

type Props = {
  /** Emplacement du Pokémon (0 à 5). */
  slot: number;
  gameSlug: string;
  gameName: string;
  pokemon: { pokemonId: number; nameFr: string };
  /** Capacités déjà choisies, dans l'ordre. */
  selected: TeamMove[];
  onChange: (moves: TeamMove[]) => void;
  onClose: () => void;
};

type State = { status: "loading" } | { status: "error" } | { status: "ready"; moves: LearnableMove[] };

/**
 * Fenêtre modale (`<dialog>`) des capacités offensives qu'un membre peut apprendre dans le jeu, avec recherche
 * et filtre par type ; quatre au plus. Chaque clic met l'équipe à jour : l'analyse suit derrière la fenêtre.
 */
export function TeamMovePicker({ slot, gameSlug, gameName, pokemon, selected, onChange, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<State>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | null>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    let active = true;
    learnableMovesAction(gameSlug, pokemon.pokemonId)
      .then((moves) => active && setState({ status: "ready", moves }))
      .catch(() => active && setState({ status: "error" }));
    return () => {
      active = false;
    };
  }, [gameSlug, pokemon.pokemonId]);

  const moves = useMemo(() => (state.status === "ready" ? state.moves : []), [state]);
  const types = useMemo(() => {
    const map = new Map(moves.map((m) => [m.type.slug, m.type.nameFr]));
    return [...map].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [moves]);
  const shown = useMemo(() => {
    const needle = normalize(query);
    return moves.filter((m) => (!type || m.type.slug === type) && (!needle || normalize(m.nameFr).includes(needle)));
  }, [moves, query, type]);

  const selectedIds = new Set(selected.map((m) => m.id));
  const full = selected.length >= MAX_MOVES;
  const toggle = (move: LearnableMove) => {
    if (selectedIds.has(move.id)) return onChange(selected.filter((m) => m.id !== move.id));
    if (!full) onChange([...selected, toTeamMove(move)]);
  };

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      // Un clic sur le voile (hors de la boîte) ferme la fenêtre.
      onClick={(event) => event.target === event.currentTarget && dialog.current?.close()}
      aria-labelledby="team-move-picker-title"
      className="m-auto h-[min(88dvh,760px)] w-[calc(100%-24px)] max-w-2xl flex-col overflow-hidden rounded-lg border border-line bg-surface p-0 text-ink shadow-float backdrop:bg-scrim open:flex"
    >
      <div className="space-y-3 border-b border-line p-4 sm:px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <p className="t-caption">
              Emplacement {slot + 1} · {selected.length}/{MAX_MOVES} attaques
            </p>
            <h2 id="team-move-picker-title" className="t-h2">
              Attaques de {pokemon.nameFr}
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
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom de l'attaque…"
              aria-label="Chercher une attaque"
              autoComplete="off"
              className={`${input} h-10 rounded-full border-line pl-9 text-sm`}
            />
          </div>
          <ToolbarSelect
            label="Type"
            value={type ?? ""}
            onChange={(slug) => setType(slug || null)}
            options={types}
            placeholder="Tous"
            highlight={type !== null}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {state.status === "loading" ? (
          <p className="p-5 text-ink-2">Chargement des attaques…</p>
        ) : state.status === "error" ? (
          <p role="alert" className="p-5 text-danger">
            Impossible de charger les attaques pour le moment.
          </p>
        ) : moves.length === 0 ? (
          <p className="p-5 text-ink-2">Aucune attaque connue pour {pokemon.nameFr} dans {gameName}.</p>
        ) : shown.length === 0 ? (
          <p className="p-5 text-ink-2">Aucune attaque ne correspond.</p>
        ) : (
          <ul className="divide-y divide-line">
            {shown.map((move) => {
              const picked = selectedIds.has(move.id);
              return (
                <li key={move.id}>
                  <button
                    type="button"
                    onClick={() => toggle(move)}
                    aria-pressed={picked}
                    disabled={!picked && full}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent sm:px-5"
                  >
                    <span className={checkCircle(picked)}>
                      <CheckIcon />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{move.nameFr}</span>
                      <span className="block t-small text-ink-2">
                        {CATEGORY_LABELS[move.category]} · {learnMethodLabel(move.method, move.level)}
                        {move.fixedDamage && " · dégâts fixes"}
                      </span>
                    </span>
                    <TypeBadge type={move.type} />
                    <span className="w-16 shrink-0 text-right t-small tabular-nums">
                      <span className="block font-semibold">{move.power ?? "—"}</span>
                      <span className="block text-ink-3">{move.accuracy === null ? "—" : `${move.accuracy} %`}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-2 px-4 py-3 sm:px-5">
        <p className="t-small text-ink-2">Puissance · précision · dans {gameName}</p>
        <button type="button" onClick={() => dialog.current?.close()} className={primaryButton}>
          Terminé
        </button>
      </div>
    </dialog>
  );
}
