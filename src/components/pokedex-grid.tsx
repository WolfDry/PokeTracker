"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon } from "@/components/icons";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { ProgressBar } from "@/components/progress-bar";
import { TypeBadge } from "@/components/type-badge";
import { card, cardLink, checkCircle, chip, chipCount, dexNumber, spriteBox, textLink } from "@/components/ui";
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

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Tous", count: entries.length },
    { key: "caught", label: "Attrapés", count: caughtCount },
    { key: "missing", label: "Manquants", count: entries.length - caughtCount },
  ];

  return (
    <div className="space-y-5">
      {signedIn ? (
        <div className={`${card} space-y-4 p-5`}>
          <ProgressBar caught={caughtCount} total={entries.length} label="Attrapés" />
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer le Pokédex">
            {filters.map((f) => (
              <button key={f.key} type="button" className={chip(filter === f.key)} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
                {f.label} <span className={chipCount(filter === f.key)}>{f.count}</span>
              </button>
            ))}
            {captures.error && (
              <span role="alert" className="ml-auto t-small text-danger">
                {captures.error}
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="t-small text-ink-2">
          <Link href={`/connexion?next=${encodeURIComponent(loginNext)}`} className={textLink}>
            Connecte-toi
          </Link>{" "}
          pour cocher les Pokémon attrapés dans ce jeu.
        </p>
      )}

      {shown.length === 0 ? (
        <p className="text-ink-2">{filter === "caught" ? "Aucun Pokémon attrapé pour l'instant." : "Pokédex complet, bravo !"}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((entry) => {
            const caught = captures.captured.has(entry.species.id);
            return (
              <li key={entry.species.id} className={`${cardLink} flex items-center gap-3 p-3`}>
                <Link href={`/pokemon/${entry.species.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className={`${spriteBox} size-14`}>
                    <PokemonSprite pokemonId={entry.species.pokemonId} alt={entry.species.nameFr} size={56} />
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex items-baseline gap-2">
                      <span className="t-small text-ink-3">{dexNumber(entry.number)}</span>
                      <span className="truncate font-semibold">{entry.species.nameFr}</span>
                    </span>
                    <span className="flex flex-wrap gap-1">
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
                    className="-m-2 grid size-11 place-items-center"
                  >
                    <span className={checkCircle(caught)}>
                      <CheckIcon />
                    </span>
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
