"use client";

import type { ChecklistEntry } from "@/components/capture-checklist";
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from "@/components/icons";
import { BOX_SIZE, pickLabel, roundButton, type Wording } from "@/components/living-dex-shared";
import { DexSprite } from "@/components/living-dex-sprite";
import { dexNumber } from "@/components/ui";

type Props = {
  entries: ChecklistEntry[];
  captured: Set<number>;
  /** Recherche et filtre : les cases qui ne correspondent pas s'estompent, le rangement reste visible. */
  matches: (entry: ChecklistEntry) => boolean;
  /** Shiny dex : chasse en cours sur un shiny manquant, repérée d'une étoile. */
  isHunting: (entry: ChecklistEntry) => boolean;
  selectedId: number | undefined;
  quick: boolean;
  shiny: boolean;
  wording: Wording;
  /** Première des deux boîtes affichées (0 = boîte 1). */
  start: number;
  onStart: (box: number) => void;
  onPick: (entry: ChecklistEntry) => void;
};

/** Le Pokédex rangé en boîtes de 30, deux à la fois, avec la carte de toutes les boîtes au-dessus. */
export function LivingDexBoxes({ entries, captured, matches, isHunting, selectedId, quick, shiny, wording, start, onStart, onPick }: Props) {
  const boxes = Array.from({ length: Math.ceil(entries.length / BOX_SIZE) }, (_, index) => {
    const content = entries.slice(index * BOX_SIZE, (index + 1) * BOX_SIZE);
    return { index, entries: content, caught: content.filter((entry) => captured.has(entry.species.id)).length };
  });
  const shown = boxes.slice(start, start + 2);
  const paged = boxes.length > 2;

  return (
    <div className="flex flex-col gap-3.5">
      {paged && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-1.5">
          {boxes.map((box) => {
            const on = box.index >= start && box.index < start + 2;
            const complete = box.caught === box.entries.length;
            return (
              <button
                key={box.index}
                type="button"
                onClick={() => onStart(box.index)}
                aria-label={`Boîte ${box.index + 1} : ${box.caught} sur ${box.entries.length}`}
                aria-current={on ? "true" : undefined}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-xl border bg-surface px-1 py-1.5 transition-colors ${
                  on ? "border-game ring-1 ring-game ring-inset" : "border-line hover:border-line-strong"
                }`}
              >
                <span className="text-[11px] leading-[14px] font-bold text-ink-2">B{box.index + 1}</span>
                <span aria-hidden className="relative h-5 w-full overflow-hidden rounded-md bg-surface-2">
                  <span
                    className={`absolute inset-x-0 bottom-0 ${complete ? "bg-success" : "bg-game"}`}
                    style={{ height: `${Math.round((box.caught / box.entries.length) * 100)}%` }}
                  />
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold">
          {shown.length > 1 ? `Boîtes ${start + 1}–${start + 2}` : `Boîte ${start + 1}`}{" "}
          <span className="font-sans text-sm font-medium text-ink-2">sur {boxes.length}</span>
        </h2>
        {paged && (
          <div className="flex gap-2">
            <button type="button" aria-label="Boîtes précédentes" disabled={start === 0} onClick={() => onStart(start - 2)} className={roundButton}>
              <ChevronLeftIcon size={20} />
            </button>
            <button type="button" aria-label="Boîtes suivantes" disabled={start + 2 >= boxes.length} onClick={() => onStart(start + 2)} className={roundButton}>
              <ChevronRightIcon size={20} />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {shown.map((box) => {
          const complete = box.caught === box.entries.length;
          const first = box.entries[0];
          const last = box.entries[box.entries.length - 1];
          return (
            <section
              key={box.index}
              aria-label={`Boîte ${box.index + 1}`}
              className="flex min-w-0 flex-[1_1_280px] flex-col gap-3 rounded-3xl border border-line bg-surface p-3.5"
            >
              <div className="flex items-center justify-between gap-3 px-1">
                <p className="flex items-baseline gap-2.5">
                  <span className="font-display font-bold">Boîte {box.index + 1}</span>
                  <span className="font-mono text-[11px] text-ink-3">
                    {dexNumber(first.number)}–{dexNumber(last.number)}
                  </span>
                </p>
                {complete ? (
                  <span className="inline-flex h-6 items-center rounded-full bg-game px-2.5 text-xs font-bold text-on-game">Complète</span>
                ) : (
                  <span className="text-[13px] font-semibold text-ink-2">
                    {box.caught} / {box.entries.length}
                  </span>
                )}
              </div>
              <ul className="grid grid-cols-6 gap-[5px]">
                {box.entries.map((entry) => {
                  const caught = captured.has(entry.species.id);
                  const selected = entry.species.id === selectedId;
                  const hunting = isHunting(entry);
                  return (
                    <li key={entry.species.id}>
                      <button
                        type="button"
                        onClick={() => onPick(entry)}
                        aria-pressed={quick ? caught : selected}
                        aria-label={pickLabel(entry.species.nameFr, caught, quick, wording, hunting)}
                        title={`${dexNumber(entry.number)} · ${entry.species.nameFr}`}
                        className={`relative grid aspect-square w-full place-items-center rounded-xl transition ${
                          caught ? "pokedex-screen" : "border border-line bg-surface-2 hover:border-line-strong"
                        } ${selected ? "outline-2 outline-offset-2 outline-game" : ""} ${matches(entry) ? "" : "opacity-25"}`}
                      >
                        {hunting && <StarIcon size={12} className="absolute top-1 left-1 fill-shiny text-shiny" />}
                        <DexSprite entry={entry} caught={caught} shiny={shiny} size={64} className={`size-[80%] object-contain ${caught ? "" : "sprite-silhouette"}`} />
                      </button>
                    </li>
                  );
                })}
                {/* Dernière boîte incomplète : les cases vides gardent la forme de la boîte. */}
                {Array.from({ length: BOX_SIZE - box.entries.length }, (_, i) => (
                  <li key={`vide-${i}`} aria-hidden className="aspect-square rounded-xl border border-dashed border-line" />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
