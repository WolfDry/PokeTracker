"use client";

import Link from "next/link";
import { useEffect, useId } from "react";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { CompleteHuntForm } from "@/components/shiny-forms";
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
    <p role="status" className={`text-xs ${status === "error" ? "text-accent" : "text-muted"}`}>
      {status === "error" ? (
        <>
          {error ?? STATUS_LABEL.error}{" "}
          <button type="button" onClick={retry} className="underline hover:text-foreground">
            Réessayer
          </button>
        </>
      ) : (
        STATUS_LABEL[status]
      )}
    </p>
  );
}

const roundButton = "flex items-center justify-center rounded-full border border-border bg-card font-medium transition-colors hover:border-accent active:bg-accent/15 disabled:opacity-40";

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
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          <button type="button" onClick={() => add(-1)} disabled={counter.count === 0} aria-label="Retirer une rencontre" className={`${roundButton} size-16 text-2xl`}>
            −1
          </button>
          <output aria-live="off" className="min-w-40 text-center text-6xl font-semibold tabular-nums sm:text-7xl">
            {numberFr.format(counter.count)}
          </output>
          <button type="button" onClick={() => add(1)} aria-label="Ajouter une rencontre" className={`${roundButton} size-20 border-accent bg-accent text-3xl text-accent-foreground hover:opacity-90`}>
            +1
          </button>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <label htmlFor={inputId} className="flex items-center gap-2 text-muted">
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
              className="w-28 rounded-md border border-border bg-background px-2 py-1 text-right tabular-nums text-foreground focus:border-accent focus:outline-none"
            />
          </label>
          <StatusLine status={counter.status} error={counter.error} retry={counter.retry} />
        </div>
        <p className="mt-3 hidden text-center text-xs text-muted sm:block">
          Clavier : <kbd className="rounded border border-border px-1">+</kbd>, <kbd className="rounded border border-border px-1">Espace</kbd> ou{" "}
          <kbd className="rounded border border-border px-1">↑</kbd> pour +1 · <kbd className="rounded border border-border px-1">−</kbd> ou{" "}
          <kbd className="rounded border border-border px-1">↓</kbd> pour −1
        </p>
      </div>

      <details className="group rounded-lg border border-emerald-500/50 bg-emerald-500/5">
        <summary className="cursor-pointer list-none px-4 py-3 font-medium marker:hidden [&::-webkit-details-marker]:hidden">
          <span className="mr-2 inline-block transition-transform group-open:rotate-90">▸</span>✨ Shiny trouvé !
        </summary>
        <div className="border-t border-emerald-500/30 px-4 py-4">
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
    <li className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <Link href={`/shiny/chasse/${hunt.id}`} className="shrink-0">
        <PokemonSprite pokemonId={hunt.species.pokemonId} alt="" size={64} shiny />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/shiny/chasse/${hunt.id}`} className="block truncate font-medium hover:text-accent">
          {hunt.species.nameFr}
        </Link>
        <p className="truncate text-xs text-muted">{hunt.method ?? "Méthode non précisée"}</p>
        <StatusLine status={counter.status} error={counter.error} retry={counter.retry} />
      </div>
      <output className="text-2xl font-semibold tabular-nums">{numberFr.format(counter.count)}</output>
      <button type="button" onClick={() => counter.add(1)} aria-label={`+1 pour ${hunt.species.nameFr}`} className={`${roundButton} size-12 text-lg`}>
        +1
      </button>
    </li>
  );
}
