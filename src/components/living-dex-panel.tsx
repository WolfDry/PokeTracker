"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { ChecklistEntry } from "@/components/capture-checklist";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/icons";
import { BOX_SIZE, formatLevel, roundButton } from "@/components/living-dex-shared";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { TypeBadge } from "@/components/type-badge";
import { dexNumber, gameButton, pillButton, textLink } from "@/components/ui";

const MAX_LOCATIONS = 3;

type Props = {
  entry: ChecklistEntry;
  /** Place dans le Pokédex (0 = premier) : « Boîte 2 · case 7 ». */
  index: number;
  caught: boolean;
  /** National : pas de coche, les jeux où l'espèce est attrapée à la place des lieux. */
  readOnly: boolean;
  caughtIn?: string[];
  coverageNote: string | null;
  /** Rang de chaque lieu dans la progression du jeu : les lieux s'affichent dans l'ordre où on les atteint. */
  ranks: Map<number, number>;
  onToggle: () => void;
  onStep: (delta: number) => void;
  /** Mobile : tiroir ouvert au choix d'un Pokémon. Dès `lg`, le panneau est toujours là, collé à droite. */
  open: boolean;
  onClose: () => void;
};

/** Pokémon sélectionné dans la mosaïque ou les boîtes : son écran, de quoi le cocher et où le trouver. */
export function LivingDexPanel({ entry, index, caught, readOnly, caughtIn, coverageNote, ranks, onToggle, onStep, open, onClose }: Props) {
  const { species } = entry;
  const rank = (id: number) => ranks.get(id) ?? ranks.size;
  const locations = [...entry.locations].sort((a, b) => rank(a.id) - rank(b.id));
  const extra = locations.length - MAX_LOCATIONS;

  // Tiroir mobile : Échap le referme.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {open && <div aria-hidden className="fixed inset-0 z-30 bg-scrim lg:hidden" onClick={onClose} />}
      <aside
        aria-label="Pokémon sélectionné"
        className={`flex-col gap-3.5 rounded-3xl border border-line bg-surface p-5 lg:sticky lg:top-24 lg:flex lg:min-w-0 lg:flex-[1_1_320px] ${
          open
            ? "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:mx-auto max-lg:flex max-lg:max-h-[85dvh] max-lg:max-w-xl max-lg:overflow-y-auto max-lg:rounded-b-none max-lg:pb-[max(env(safe-area-inset-bottom),20px)]"
            : "hidden"
        }`}
      >
        <div className="relative grid h-[200px] shrink-0 place-items-center rounded-[16px_16px_16px_40px] pokedex-screen">
          <span className="absolute top-2.5 left-3.5 font-mono text-sm font-bold text-game-text">N° {dexNumber(entry.number)}</span>
          <span
            className={`absolute top-2.5 right-3 inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold ${
              caught ? "bg-game text-on-game" : "border border-line-strong bg-surface text-ink-2"
            }`}
          >
            {caught ? "Attrapé" : "Manquant"}
          </span>
          <PokemonSprite key={species.pokemonId} pokemonId={species.pokemonId} fallbackId={species.id} alt={species.nameFr} size={160} className="size-[156px] object-contain" />
        </div>

        <div className="flex items-center justify-between gap-2">
          <h2 className="min-w-0 font-display text-[28px] leading-8 font-bold tracking-[-0.015em]">
            <Link href={`/pokemon/${species.id}`} className="hover:underline">
              {species.nameFr}
            </Link>
          </h2>
          <div className="flex gap-1.5">
            <button type="button" aria-label="Pokémon précédent" onClick={() => onStep(-1)} className={roundButton}>
              <ChevronLeftIcon size={20} />
            </button>
            <button type="button" aria-label="Pokémon suivant" onClick={() => onStep(1)} className={roundButton}>
              <ChevronRightIcon size={20} />
            </button>
            <button type="button" aria-label="Fermer" onClick={onClose} className={`${roundButton} lg:hidden`}>
              <CloseIcon size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {species.types.map((type) => (
            <TypeBadge key={type.slug} type={type} size="md" />
          ))}
          <span className="ml-auto text-xs text-ink-3">
            Boîte {Math.floor(index / BOX_SIZE) + 1} · case {(index % BOX_SIZE) + 1}
          </span>
        </div>

        {!readOnly && (
          <button type="button" onClick={onToggle} className={`${caught ? pillButton : gameButton} w-full`}>
            {caught ? "Retirer des captures" : "Marquer comme attrapé"}
          </button>
        )}

        <div className="border-t border-line pt-3.5">
          <p className="mb-1.5 t-caption font-bold">{readOnly ? "Attrapé dans" : "Où le trouver"}</p>
          {readOnly ? (
            <p className="t-small text-ink-2">{caught ? (caughtIn?.join(", ") ?? "—") : "Pas encore attrapé dans un jeu."}</p>
          ) : locations.length === 0 ? (
            <p className="t-small text-ink-2">
              {coverageNote
                ? "Lieux inconnus pour ce jeu."
                : species.evolvesFromNameFr
                  ? `Pas de rencontre sauvage : évolution de ${species.evolvesFromNameFr}.`
                  : "Pas de rencontre sauvage : œuf, cadeau, échange ou événement."}
            </p>
          ) : (
            <>
              <ul>
                {locations.slice(0, MAX_LOCATIONS).map((location) => (
                  <li key={location.id}>
                    <Link href={`/rencontres/${location.versionSlug}/${location.slug}`} className="group flex items-center gap-3 py-1.5">
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm leading-5 font-semibold group-hover:underline">{location.nameFr}</span>
                        <span className="text-xs text-ink-2">{location.methods.join(", ")}</span>
                      </span>
                      <span className="font-mono text-xs whitespace-nowrap text-ink-2">{formatLevel(location.minLevel, location.maxLevel)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {extra > 0 && (
                <Link href={`/pokemon/${species.id}`} className={`${textLink} mt-1 inline-block t-small text-ink-2`}>
                  + {extra} autre{extra > 1 ? "s" : ""} lieu{extra > 1 ? "x" : ""} · voir la fiche
                </Link>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
