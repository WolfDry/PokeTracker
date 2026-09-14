"use client";

import { useId, useRef, useState, useTransition } from "react";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { dexNumber, fieldLabel, ghostButton, input, inputError, smallButton, spriteBox } from "@/components/ui";
import type { SpeciesPick } from "@/lib/data/search";
import { searchSpeciesAction } from "@/lib/shiny-actions";

type Props = {
  label: string;
  /** Espèce présélectionnée (lien « Chasser en shiny » depuis une fiche). */
  initial?: SpeciesPick | null;
  error?: string;
  autoFocus?: boolean;
};

const SEARCH_DELAY = 150;

/**
 * Champ « Pokémon » des formulaires shiny : recherche par nom ou numéro avec suggestions,
 * l'espèce choisie est envoyée dans un champ caché `speciesId`.
 */
export function SpeciesPicker({ label, initial = null, error, autoFocus }: Props) {
  const id = useId();
  const [selected, setSelected] = useState<SpeciesPick | null>(initial);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SpeciesPick[]>([]);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const request = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Recherche après un court délai de frappe ; on ignore les réponses dépassées.
  const onChange = (value: string) => {
    setQuery(value);
    clearTimeout(timer.current);
    const current = ++request.current;
    if (value.trim() === "") {
      setHits([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const results = await searchSpeciesAction(value);
        if (request.current === current) {
          setHits(results);
          setActive(0);
          setOpen(true);
        }
      });
    }, SEARCH_DELAY);
  };

  const choose = (species: SpeciesPick) => {
    setSelected(species);
    setQuery("");
    setHits([]);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || hits.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % hits.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + hits.length) % hits.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(hits[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const message = error ?? (query.trim() && !selected && open && hits.length === 0 ? "Aucun Pokémon ne correspond." : undefined);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      <input type="hidden" name="speciesId" value={selected?.id ?? ""} />
      {selected ? (
        <div className="flex items-center gap-3 rounded-md border border-line-strong bg-surface p-1.5 pr-2">
          <span className={`${spriteBox} size-10 rounded-sm`}>
            <PokemonSprite pokemonId={selected.pokemonId} alt="" size={40} shiny />
          </span>
          <span className="flex flex-1 items-baseline gap-2 font-semibold">
            <span className="t-small font-normal text-ink-3">{dexNumber(selected.id, 4)}</span>
            {selected.nameFr}
          </span>
          <button type="button" onClick={() => setSelected(null)} className={`${ghostButton} ${smallButton}`}>
            Changer
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            id={id}
            type="text"
            value={query}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => hits.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder="Nom ou numéro (Pikachu, 25…)"
            autoComplete="off"
            autoFocus={autoFocus}
            role="combobox"
            aria-expanded={open && hits.length > 0}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-invalid={error ? true : undefined}
            aria-describedby={message ? `${id}-message` : undefined}
            className={`${input} h-10 ${error ? inputError : ""}`}
          />
          {open && hits.length > 0 && (
            <ul id={`${id}-list`} role="listbox" className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-md border border-line bg-surface p-1 shadow-float">
              {hits.map((species, index) => (
                <li key={species.id} role="option" aria-selected={index === active}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(species)}
                    onMouseEnter={() => setActive(index)}
                    className={`flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left ${index === active ? "bg-surface-2" : ""}`}
                  >
                    <PokemonSprite pokemonId={species.pokemonId} alt="" size={36} shiny />
                    <span className="t-small text-ink-3">{dexNumber(species.id, 4)}</span>
                    <span className="font-medium">{species.nameFr}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {message && (
        <p id={`${id}-message`} className={`t-small ${error ? "text-danger" : "text-ink-2"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
