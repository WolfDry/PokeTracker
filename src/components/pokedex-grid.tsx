"use client";

import Link from "next/link";
import { useState } from "react";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { ProgressBar } from "@/components/progress-bar";
import { TypeBadge } from "@/components/type-badge";
import { useCaptures } from "@/components/use-captures";
import type { PokedexGridEntry } from "@/lib/data/pokedex";

type Props = {
  entries: PokedexGridEntry[];
  versionId: number;
  /** Espèces cochées dans ce jeu ; `null` = personne n'est connecté (grille sans cases). */
  captured: number[] | null;
  /** Page à rouvrir après connexion. */
  loginNext: string;
};

type Filter = "all" | "caught" | "missing";

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-sm transition-colors ${
    active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card hover:border-accent"
  }`;

/** Grille du Pokédex d'un jeu, avec la case « attrapé » par Pokémon quand on est connecté. */
export function PokedexGrid({ entries, versionId, captured, loginNext }: Props) {
  const signedIn = captured !== null;
  const captures = useCaptures(versionId, captured ?? []);
  const [filter, setFilter] = useState<Filter>("all");

  const caughtCount = entries.filter((e) => captures.captured.has(e.species.id)).length;
  const shown = entries.filter((e) => {
    if (filter === "all") return true;
    return captures.captured.has(e.species.id) === (filter === "caught");
  });

  return (
    <div className="space-y-4">
      {signedIn ? (
        <div className="space-y-3 rounded-lg border border-border bg-card p-3">
          <ProgressBar caught={caughtCount} total={entries.length} label="Attrapés" />
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer le Pokédex">
            <button type="button" className={chip(filter === "all")} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
              Tous ({entries.length})
            </button>
            <button type="button" className={chip(filter === "caught")} aria-pressed={filter === "caught"} onClick={() => setFilter("caught")}>
              Attrapés ({caughtCount})
            </button>
            <button type="button" className={chip(filter === "missing")} aria-pressed={filter === "missing"} onClick={() => setFilter("missing")}>
              Manquants ({entries.length - caughtCount})
            </button>
            {captures.error && (
              <span role="alert" className="ml-auto text-sm text-accent">
                {captures.error}
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">
          <Link href={`/connexion?next=${encodeURIComponent(loginNext)}`} className="underline hover:text-foreground">
            Connecte-toi
          </Link>{" "}
          pour cocher les Pokémon attrapés dans ce jeu.
        </p>
      )}

      {shown.length === 0 ? (
        <p className="text-muted">{filter === "caught" ? "Aucun Pokémon attrapé pour l'instant." : "Pokédex complet, bravo !"}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {shown.map((entry) => {
            const caught = captures.captured.has(entry.species.id);
            return (
              <li
                key={entry.species.id}
                className={`relative flex items-center gap-2 rounded-lg border p-2 transition-colors ${
                  caught ? "border-emerald-500/60 bg-emerald-500/10" : "border-border bg-card hover:border-accent"
                }`}
              >
                <Link href={`/pokemon/${entry.species.id}`} className="flex min-w-0 flex-1 items-center gap-2">
                  <PokemonSprite pokemonId={entry.species.pokemonId} alt={entry.species.nameFr} size={56} className="shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-xs text-muted">N° {String(entry.number).padStart(3, "0")}</span>
                    <span className="block truncate font-medium">{entry.species.nameFr}</span>
                    <span className="mt-0.5 flex flex-wrap gap-1">
                      {entry.species.types.map((type) => (
                        <TypeBadge key={type.slug} type={type} />
                      ))}
                    </span>
                  </span>
                </Link>
                {signedIn && (
                  <button
                    type="button"
                    onClick={() => captures.toggle(entry.species.id)}
                    aria-pressed={caught}
                    aria-label={`${caught ? "Retirer" : "Marquer"} ${entry.species.nameFr} ${caught ? "des captures" : "comme attrapé"}`}
                    title={caught ? "Attrapé — cliquer pour retirer" : "Marquer comme attrapé"}
                    className={`absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full border text-xs sm:size-6 transition-colors ${
                      caught
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-border bg-background text-transparent hover:border-emerald-500 hover:text-emerald-500"
                    }`}
                  >
                    ✓
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
