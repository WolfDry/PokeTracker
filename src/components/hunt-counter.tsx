"use client";

import Link from "next/link";
import { useEffect, useId } from "react";
import { ChevronRightIcon, MinusIcon, PlusIcon, StarIcon } from "@/components/icons";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { CompleteHuntForm } from "@/components/shiny-forms";
import { card, cardLink, input, secondaryButton, spriteBox, textLink } from "@/components/ui";
import { useHuntCounter, type SaveStatus } from "@/components/use-hunt-counter";
import type { Hunt } from "@/lib/data/shiny";

const numberFr = new Intl.NumberFormat("fr-FR");

const STATUS_LABEL: Record<SaveStatus, string> = {
  saved: "Enregistré",
  pending: "Modifié…",
  saving: "Enregistrement…",
  error: "Non enregistré",
};

function StatusLine({ status, error, retry }: { status: SaveStatus; error: string | null; retry: () => void }) {
  return (
    <p role="status" className={`t-small ${status === "error" ? "text-danger" : "text-ink-3"}`}>
      {status === "error" ? (
        <>
          {error ?? STATUS_LABEL.error}{" "}
          <button type="button" onClick={retry} className={textLink}>
            Réessayer
          </button>
        </>
      ) : (
        STATUS_LABEL[status]
      )}
    </p>
  );
}

const kbd = "inline-block min-w-[22px] rounded-[6px] border border-b-2 border-line-strong bg-surface px-1.5 text-center text-xs leading-5 text-ink-2";

/**
 * Compteur principal d'une chasse : gros chiffre, −1 / +1, saisie directe, raccourcis clavier,
 * et le formulaire de clôture (« Shiny trouvé ! ») qui envoie le compte affiché.
 */
export function HuntCounter({ hunt }: { hunt: Hunt }) {
  const counter = useHuntCounter(hunt.id, hunt.count);
  const inputId = useId();
  const { add } = counter;

  // Clavier : + / Espace / ↑ / → = +1, − / ↓ / ← = −1, sauf dans un champ ou sur un bouton (qui gèrent Espace/Entrée eux-mêmes).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;
      if (event.key === " " && (tag === "BUTTON" || tag === "A" || tag === "SUMMARY")) return;
      if (["+", "=", " ", "ArrowUp", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        add(1);
      } else if (["-", "ArrowDown", "ArrowLeft"].includes(event.key)) {
        event.preventDefault();
        add(-1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [add]);

  return (
    <div className="space-y-4">
      <div className={`${card} flex flex-col items-center gap-6 px-5 pt-8 pb-6 sm:px-8`}>
        <div className="flex flex-col items-center gap-1">
          <output aria-live="off" className="t-counter block text-center">
            {numberFr.format(counter.count)}
          </output>
          <p className="t-small text-ink-2">rencontre{counter.count > 1 ? "s" : ""}</p>
        </div>

        {/* Le +1 est la cible principale : large, pleine encre ; le −1 reste rond et discret. */}
        <div className="flex w-full items-center gap-4">
          <button
            type="button"
            onClick={() => add(-1)}
            disabled={counter.count === 0}
            aria-label="Retirer une rencontre"
            className={`${secondaryButton} size-16 shrink-0 rounded-full px-0`}
          >
            <MinusIcon size={22} />
          </button>
          <button
            type="button"
            onClick={() => add(1)}
            aria-label="Ajouter une rencontre"
            className="inline-flex h-20 flex-1 items-center justify-center gap-2 rounded-xl bg-ink text-lg font-semibold text-on-ink transition-opacity hover:opacity-90 active:opacity-80 sm:h-[88px]"
          >
            <PlusIcon size={22} /> Ajouter
          </button>
        </div>

        <div className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <label htmlFor={inputId} className="flex items-center gap-2 t-small text-ink-2">
            Saisir directement
            <input
              id={inputId}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={counter.count}
              onChange={(event) => counter.set(event.target.valueAsNumber || 0)}
              onFocus={(event) => event.target.select()}
              className={`${input} h-9 w-28 text-right`}
            />
          </label>
          <StatusLine status={counter.status} error={counter.error} retry={counter.retry} />
        </div>
        <p className="hidden text-center t-small text-ink-3 sm:block">
          Clavier : <kbd className={kbd}>+</kbd>, <kbd className={kbd}>Espace</kbd> ou <kbd className={kbd}>↑</kbd> pour +1 · <kbd className={kbd}>−</kbd> ou{" "}
          <kbd className={kbd}>↓</kbd> pour −1
        </p>
      </div>

      <details className={`${card} group overflow-hidden`}>
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
          <span className="grid size-8 place-items-center rounded-full border border-shiny/60 text-shiny">
            <StarIcon />
          </span>
          Shiny trouvé !
          <ChevronRightIcon className="ml-auto text-ink-3 transition-transform group-open:rotate-90" />
        </summary>
        <div className="border-t border-line px-5 py-5">
          <CompleteHuntForm huntId={hunt.id} count={counter.count} />
        </div>
      </details>
    </div>
  );
}

/** Carte compacte d'une chasse en cours (page Shiny) : +1 rapide et lien vers le compteur. */
export function HuntCard({ hunt }: { hunt: Hunt }) {
  const counter = useHuntCounter(hunt.id, hunt.count);
  return (
    <li className={`${cardLink} flex items-center gap-3 p-3`}>
      <Link href={`/shiny/chasse/${hunt.id}`} className={`${spriteBox} size-14`}>
        <PokemonSprite pokemonId={hunt.species.pokemonId} alt="" size={56} shiny />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/shiny/chasse/${hunt.id}`} className="block truncate font-semibold hover:underline">
          {hunt.species.nameFr}
        </Link>
        <p className="truncate t-small text-ink-2">{hunt.method ?? "Méthode non précisée"}</p>
        <StatusLine status={counter.status} error={counter.error} retry={counter.retry} />
      </div>
      <output className="t-h1">{numberFr.format(counter.count)}</output>
      <button
        type="button"
        onClick={() => counter.add(1)}
        aria-label={`+1 pour ${hunt.species.nameFr}`}
        className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-on-ink transition-opacity hover:opacity-90"
      >
        <PlusIcon size={20} />
      </button>
    </li>
  );
}
