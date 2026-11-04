"use client";

import { type ComponentType, useMemo, useState } from "react";
import type { ChecklistEntry } from "@/components/capture-checklist";
import { BoxesIcon, CheckIcon, MosaicIcon, RouteIcon, SearchIcon } from "@/components/icons";
import { LivingDexBoxes } from "@/components/living-dex-boxes";
import { LivingDexPanel } from "@/components/living-dex-panel";
import { LivingDexRoute } from "@/components/living-dex-route";
import { BOX_SIZE, pickLabel, type RouteLocation } from "@/components/living-dex-shared";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { chip, chipCount, dexNumber } from "@/components/ui";
import { useCaptures } from "@/components/use-captures";
import { type LivingDexView, useLivingDexStore } from "@/store/living-dex-store";

type Props = {
  /** Jeu où cocher ; `null` = dex National, en lecture seule (on coche dans chaque jeu). */
  versionId: number | null;
  /** « Pokédex de Johto », au-dessus du compteur. */
  title: string;
  entries: ChecklistEntry[];
  captured: number[];
  /** Message si PokeAPI n'a pas (toutes) les rencontres de ce jeu. */
  coverageNote: string | null;
  /** National : jeux où chaque espèce est attrapée, à la place des lieux. */
  caughtIn?: Record<number, string[]>;
  /** Lieux du jeu dans l'ordre de progression ; vide = pas de vue Itinéraire. */
  route: RouteLocation[];
};

type Filter = "all" | "missing" | "caught";

const VIEWS: { id: LivingDexView; label: string; icon: ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "mosaique", label: "Mosaïque", icon: MosaicIcon },
  { id: "boites", label: "Boîtes", icon: BoxesIcon },
  { id: "itineraire", label: "Itinéraire", icon: RouteIcon },
];

/** Recherche insensible aux accents et à la casse : « evoli » trouve Évoli. */
const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/**
 * Living dex d'un jeu en trois vues, au choix mémorisé dans le navigateur : la mosaïque de tout le Pokédex
 * (par défaut), les boîtes de 30 du PC, et l'itinéraire lieu par lieu. La recherche, les captures et le
 * Pokémon sélectionné sont communs aux trois ; le panneau de détail sert la mosaïque et les boîtes.
 */
export function LivingDex({ versionId, title, entries, captured, coverageNote, caughtIn, route }: Props) {
  const readOnly = versionId === null;
  const captures = useCaptures(versionId ?? 0, captured);
  const storedView = useLivingDexStore((state) => state.view);
  const storeView = useLivingDexStore((state) => state.setView);
  // Pas d'itinéraire sans lieux de rencontre (National, jeux sans données) : on retombe sur la mosaïque.
  const hasRoute = !readOnly && entries.some((entry) => entry.locations.length > 0);
  const view: LivingDexView = storedView === "itineraire" && !hasRoute ? "mosaique" : storedView;
  const views = hasRoute ? VIEWS : VIEWS.filter((v) => v.id !== "itineraire");

  const boxCount = Math.ceil(entries.length / BOX_SIZE);
  const clampBox = (box: number) => Math.max(0, Math.min(box, boxCount - 2));

  // Pokémon du panneau : le premier manquant au départ ; les boîtes s'ouvrent sur la sienne.
  const [initial] = useState(() => Math.max(0, entries.findIndex((entry) => !captured.includes(entry.species.id))));
  const [selectedId, setSelectedId] = useState(entries[initial]?.species.id);
  const [boxStart, setBoxStart] = useState(() => clampBox(Math.floor(initial / BOX_SIZE)));
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [quick, setQuick] = useState(false);
  const [hideDone, setHideDone] = useState(true);
  // Mobile : le panneau s'ouvre en tiroir quand on choisit un Pokémon.
  const [sheetOpen, setSheetOpen] = useState(false);

  const ranks = useMemo(() => new Map(route.map((location, i) => [location.id, i])), [route]);
  const selectedIndex = Math.max(0, entries.findIndex((entry) => entry.species.id === selectedId));
  const selected = entries[selectedIndex];

  const isCaught = (entry: ChecklistEntry) => captures.captured.has(entry.species.id);
  const caughtCount = entries.filter(isCaught).length;
  const total = entries.length;
  const percent = total > 0 ? Math.round((caughtCount / total) * 1000) / 10 : 0;

  const q = normalize(query.trim());
  const matchesQuery = (entry: ChecklistEntry) => q === "" || normalize(entry.species.nameFr).includes(q) || dexNumber(entry.number).includes(q);
  const matches = (entry: ChecklistEntry) => matchesQuery(entry) && (filter === "all" || isCaught(entry) === (filter === "caught"));

  const toggle = (entry: ChecklistEntry) => {
    if (!readOnly) captures.toggle(entry.species.id);
  };
  const pick = (entry: ChecklistEntry) => {
    setSelectedId(entry.species.id);
    if (quick && !readOnly) toggle(entry);
    else setSheetOpen(true);
  };
  const changeView = (next: LivingDexView) => {
    storeView(next);
    setSheetOpen(false);
    if (next === "boites") setBoxStart(clampBox(Math.floor(selectedIndex / BOX_SIZE)));
  };
  const step = (delta: number) => setSelectedId(entries[(selectedIndex + delta + total) % total].species.id);

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "Tous", count: total },
    { id: "missing", label: "Manquants", count: total - caughtCount },
    { id: "caught", label: "Attrapés", count: caughtCount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="flex min-w-0 flex-[1_1_320px] items-center gap-5">
          <div className="shrink-0">
            <p className="t-caption font-bold">{title}</p>
            <p className="font-mono text-[32px] leading-10 font-bold whitespace-nowrap">
              {String(caughtCount).padStart(String(total).length, "0")}
              <span className="text-lg text-ink-3"> / {total}</span>
            </p>
          </div>
          <div
            role="progressbar"
            aria-label={title}
            aria-valuenow={caughtCount}
            aria-valuemin={0}
            aria-valuemax={total}
            className="mt-4 h-1.5 max-w-[280px] flex-1 overflow-hidden rounded-full bg-surface-2"
          >
            <div className={`h-full rounded-full transition-[width] ${caughtCount === total ? "bg-success" : "bg-game"}`} style={{ width: `${percent}%` }} />
          </div>
        </div>
        <div role="group" aria-label="Vue" className="flex w-full gap-0.5 rounded-full border border-line bg-surface p-1 sm:w-auto">
          {views.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => changeView(id)}
              className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-3 text-sm font-bold whitespace-nowrap transition-colors sm:flex-none sm:px-4 ${
                view === id ? "bg-ink text-on-ink" : "text-ink-2 hover:text-ink"
              }`}
            >
              <Icon size={18} className="hidden sm:block" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 rounded-[20px] border border-line bg-surface p-3">
          <label className="relative min-w-0 flex-[1_1_200px] sm:max-w-[280px]">
            <span className="sr-only">Rechercher un Pokémon</span>
            <SearchIcon className="pointer-events-none absolute top-[11px] left-3 text-ink-3" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom ou numéro"
              className="h-10 w-full rounded-full border border-line-strong bg-surface pr-3 pl-[38px] text-sm text-ink placeholder:text-ink-3 field-focus"
            />
          </label>
          {view === "itineraire" ? (
            <button type="button" className={`${chip(hideDone)} ml-auto`} aria-pressed={hideDone} onClick={() => setHideDone(!hideDone)}>
              Replier les lieux terminés
            </button>
          ) : (
            <>
              <div role="group" aria-label="Afficher" className="flex flex-wrap gap-2">
                {filters.map((f) => (
                  <button key={f.id} type="button" className={chip(filter === f.id)} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                    {f.label} <span className={chipCount(filter === f.id)}>{f.count}</span>
                  </button>
                ))}
              </div>
              {!readOnly && (
                <button
                  type="button"
                  className={`${chip(quick)} ml-auto`}
                  aria-pressed={quick}
                  onClick={() => setQuick(!quick)}
                  title="Un clic sur un Pokémon le coche au lieu de l'afficher"
                >
                  <CheckIcon size={16} strokeWidth={2} />
                  Coche rapide
                </button>
              )}
            </>
          )}
        </div>
        {captures.error && (
          <p role="alert" className="t-small text-danger">
            {captures.error}
          </p>
        )}
        {coverageNote && <p className="t-small text-ink-2">{coverageNote}</p>}
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-4">
          {view === "mosaique" && (
            <Mosaic entries={entries.filter(matches)} isCaught={isCaught} selectedId={selected?.species.id} quick={quick && !readOnly} onPick={pick} />
          )}
          {view === "boites" && (
            <LivingDexBoxes
              entries={entries}
              captured={captures.captured}
              matches={matches}
              selectedId={selected?.species.id}
              quick={quick && !readOnly}
              start={boxStart}
              onStart={(box) => setBoxStart(clampBox(box))}
              onPick={pick}
            />
          )}
          {view === "itineraire" && (
            <LivingDexRoute entries={entries.filter(matchesQuery)} captured={captures.captured} route={route} hideDone={hideDone} coverageNote={coverageNote} onToggle={toggle} />
          )}
        </div>
        {view !== "itineraire" && selected && (
          <LivingDexPanel
            entry={selected}
            index={selectedIndex}
            caught={isCaught(selected)}
            readOnly={readOnly}
            caughtIn={caughtIn?.[selected.species.id]}
            coverageNote={coverageNote}
            ranks={ranks}
            onToggle={() => toggle(selected)}
            onStep={step}
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

/** Tout le Pokédex d'un coup d'œil : attrapés en couleurs, manquants estompés. */
function Mosaic({
  entries,
  isCaught,
  selectedId,
  quick,
  onPick,
}: {
  entries: ChecklistEntry[];
  isCaught: (entry: ChecklistEntry) => boolean;
  selectedId: number | undefined;
  quick: boolean;
  onPick: (entry: ChecklistEntry) => void;
}) {
  if (entries.length === 0) return <p className="text-ink-2">Aucun Pokémon ne correspond.</p>;
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(84px,1fr))]">
      {entries.map((entry) => {
        const caught = isCaught(entry);
        const selected = entry.species.id === selectedId;
        return (
          <li key={entry.species.id}>
            <button
              type="button"
              onClick={() => onPick(entry)}
              aria-pressed={quick ? caught : selected}
              aria-label={pickLabel(entry.species.nameFr, caught, quick)}
              title={entry.species.nameFr}
              className={`relative flex aspect-square w-full flex-col items-center justify-center rounded-2xl border bg-surface px-1 pt-1.5 pb-1 transition-colors ${
                selected ? "border-game ring-1 ring-game ring-inset" : "border-line hover:border-line-strong"
              }`}
            >
              {caught && (
                <span aria-hidden className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-game text-on-game">
                  <CheckIcon size={10} strokeWidth={3} />
                </span>
              )}
              <PokemonSprite
                pokemonId={entry.species.pokemonId}
                fallbackId={entry.species.id}
                alt=""
                size={96}
                className={`size-[72%] object-contain transition ${caught ? "" : "opacity-30 grayscale"}`}
              />
              <span className="font-mono text-[10px] leading-3 text-ink-3">{dexNumber(entry.number)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
