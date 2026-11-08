"use client";

import { type ComponentType, useMemo, useState } from "react";
import type { ChecklistEntry } from "@/components/capture-checklist";
import { BoxesIcon, CheckIcon, EyeIcon, EyeOffIcon, MosaicIcon, RouteIcon, SearchIcon, StarIcon } from "@/components/icons";
import { LivingDexBoxes } from "@/components/living-dex-boxes";
import { LivingDexPanel } from "@/components/living-dex-panel";
import { LivingDexRoute } from "@/components/living-dex-route";
import { BOX_SIZE, pickLabel, type RouteLocation, WORDING, type Wording } from "@/components/living-dex-shared";
import { DexSprite } from "@/components/living-dex-sprite";
import { chip, chipCount, dexNumber } from "@/components/ui";
import { useCaptures } from "@/components/use-captures";
import type { ShinyDexMeta } from "@/lib/data/shiny";
import { toggleShinyAction } from "@/lib/shiny-actions";
import { type LivingDexView, useLivingDexStore } from "@/store/living-dex-store";
import { useSpoilerStore } from "@/store/spoiler-store";

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
  /** Lieux du jeu dans l'ordre de progression : ordre des lieux du panneau, et vue Itinéraire (sauf au shiny dex). */
  route: RouteLocation[];
  /** Shiny dex : sprites chromatiques, coches enregistrées comme shinies, chasses ; pas d'itinéraire. */
  shiny?: { gameSlug: string; meta: Record<number, ShinyDexMeta> };
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
 * Living dex (ou shiny dex) d'un jeu en plusieurs vues, au choix mémorisé dans le navigateur pour chaque page :
 * la mosaïque de tout le Pokédex (par défaut), les boîtes de 30 du PC, et l'itinéraire lieu par lieu (living dex
 * seulement). La recherche, les coches, la coche rapide, le Pokémon sélectionné et son panneau de détail sont
 * communs aux trois vues.
 */
export function LivingDex({ versionId, title, entries, captured, coverageNote, caughtIn, route, shiny }: Props) {
  const readOnly = versionId === null;
  const wording: Wording = shiny ? WORDING.shiny : WORDING.captures;
  const captures = useCaptures(versionId ?? 0, captured, shiny ? toggleShinyAction : undefined);
  const spoilers = useSpoilerStore();
  const page = shiny ? "shiny" : "captures";
  const storedView = useLivingDexStore((state) => state.views[page]);
  const storeView = useLivingDexStore((state) => state.setView);
  // Pas d'itinéraire au shiny dex ni sans lieux de rencontre (National, jeux sans données) : on retombe sur la mosaïque.
  const hasRoute = !readOnly && !shiny && entries.some((entry) => entry.locations.length > 0);
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
  // Chasse en cours sur un shiny manquant : repérée dans la mosaïque et les boîtes.
  const isHunting = (entry: ChecklistEntry) => Boolean(shiny?.meta[entry.species.id]?.hunt) && !isCaught(entry);
  const caughtCount = entries.filter(isCaught).length;
  const total = entries.length;
  const percent = total > 0 ? Math.round((caughtCount / total) * 1000) / 10 : 0;

  const q = normalize(query.trim());
  const matchesQuery = (entry: ChecklistEntry) => q === "" || normalize(entry.species.nameFr).includes(q) || dexNumber(entry.number).includes(q);
  const matches = (entry: ChecklistEntry) => matchesQuery(entry) && (filter === "all" || isCaught(entry) === (filter === "caught"));

  const toggle = (entry: ChecklistEntry) => {
    if (readOnly) return;
    const meta = shiny?.meta[entry.species.id];
    // Décocher un shiny supprime ses fiches (et la chasse dont il vient) : on confirme s'il y a de quoi perdre.
    if (shiny && isCaught(entry) && meta?.detailed) {
      const many = meta.count > 1;
      const message = `Supprimer ${many ? `les ${meta.count} shinies` : "le shiny"} de ${entry.species.nameFr} de ce jeu, avec ${many ? "leurs chasses et leurs détails" : "sa chasse et ses détails"} ?`;
      if (!window.confirm(message)) return;
    }
    captures.toggle(entry.species.id, entry.species.pokemonId);
  };
  const pick = (entry: ChecklistEntry) => {
    setSelectedId(entry.species.id);
    if (quick && !readOnly) toggle(entry);
    else setSheetOpen(true);
  };
  const changeView = (next: LivingDexView) => {
    storeView(page, next);
    setSheetOpen(false);
    if (next === "boites") setBoxStart(clampBox(Math.floor(selectedIndex / BOX_SIZE)));
  };
  const step = (delta: number) => setSelectedId(entries[(selectedIndex + delta + total) % total].species.id);

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "Tous", count: total },
    { id: "missing", label: "Manquants", count: total - caughtCount },
    { id: "caught", label: wording.caughtPlural, count: caughtCount },
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
          {view !== "itineraire" && (
            <div role="group" aria-label="Afficher" className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button key={f.id} type="button" className={chip(filter === f.id)} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                  {f.label} <span className={chipCount(filter === f.id)}>{f.count}</span>
                </button>
              ))}
            </div>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            {view === "itineraire" && (
              <button type="button" className={chip(hideDone)} aria-pressed={hideDone} onClick={() => setHideDone(!hideDone)}>
                Replier les lieux terminés
              </button>
            )}
            {shiny && (
              <button
                type="button"
                className={chip(spoilers.shinyRevealed)}
                aria-pressed={spoilers.shinyRevealed}
                onClick={spoilers.toggleShinyRevealed}
                title={spoilers.shinyRevealed ? "Afficher les manquants en couleurs normales" : "Afficher les manquants en shiny"}
              >
                {spoilers.shinyRevealed ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
                Spoilers
              </button>
            )}
            {!readOnly && (
              <button
                type="button"
                className={chip(quick)}
                aria-pressed={quick}
                onClick={() => setQuick(!quick)}
                title="Un clic sur un Pokémon le coche au lieu de l'afficher"
              >
                <CheckIcon size={16} strokeWidth={2} />
                Coche rapide
              </button>
            )}
          </div>
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
            <Mosaic
              entries={entries.filter(matches)}
              isCaught={isCaught}
              isHunting={isHunting}
              selectedId={selected?.species.id}
              quick={quick && !readOnly}
              shiny={Boolean(shiny)}
              revealed={Boolean(shiny) && spoilers.shinyRevealed}
              wording={wording}
              onPick={pick}
            />
          )}
          {view === "boites" && (
            <LivingDexBoxes
              entries={entries}
              captured={captures.captured}
              matches={matches}
              isHunting={isHunting}
              selectedId={selected?.species.id}
              quick={quick && !readOnly}
              shiny={Boolean(shiny)}
              wording={wording}
              start={boxStart}
              onStart={(box) => setBoxStart(clampBox(box))}
              onPick={pick}
            />
          )}
          {view === "itineraire" && (
            <LivingDexRoute
              entries={entries.filter(matchesQuery)}
              captured={captures.captured}
              route={route}
              hideDone={hideDone}
              coverageNote={coverageNote}
              selectedId={selected?.species.id}
              quick={quick && !readOnly}
              wording={wording}
              onPick={pick}
              onToggle={toggle}
            />
          )}
        </div>
        {selected && (
          <LivingDexPanel
            entry={selected}
            index={selectedIndex}
            caught={isCaught(selected)}
            readOnly={readOnly}
            caughtIn={caughtIn?.[selected.species.id]}
            coverageNote={coverageNote}
            ranks={ranks}
            wording={wording}
            shiny={shiny && { gameSlug: shiny.gameSlug, meta: shiny.meta[selected.species.id] }}
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

/** Tout le Pokédex d'un coup d'œil : attrapés en couleurs, manquants estompés ; étoile sur une chasse en cours. */
function Mosaic({
  entries,
  isCaught,
  isHunting,
  selectedId,
  quick,
  shiny,
  revealed,
  wording,
  onPick,
}: {
  entries: ChecklistEntry[];
  isCaught: (entry: ChecklistEntry) => boolean;
  isHunting: (entry: ChecklistEntry) => boolean;
  selectedId: number | undefined;
  quick: boolean;
  shiny: boolean;
  /** Shiny dex, spoilers révélés : les manquants gardent leurs couleurs chromatiques, simplement estompés. */
  revealed: boolean;
  wording: Wording;
  onPick: (entry: ChecklistEntry) => void;
}) {
  if (entries.length === 0) return <p className="text-ink-2">Aucun Pokémon ne correspond.</p>;
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(84px,1fr))]">
      {entries.map((entry) => {
        const caught = isCaught(entry);
        const hunting = isHunting(entry);
        const selected = entry.species.id === selectedId;
        return (
          <li key={entry.species.id}>
            <button
              type="button"
              onClick={() => onPick(entry)}
              aria-pressed={quick ? caught : selected}
              aria-label={pickLabel(entry.species.nameFr, caught, quick, wording, hunting)}
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
              {hunting && <StarIcon size={14} className="absolute top-1.5 left-1.5 fill-shiny text-shiny" />}
              <DexSprite
                entry={entry}
                caught={caught}
                shiny={shiny}
                size={96}
                className={`size-[72%] object-contain transition ${caught ? "" : revealed ? "opacity-40" : "opacity-30 grayscale"}`}
              />
              <span className="font-mono text-[10px] leading-3 text-ink-3">{dexNumber(entry.number)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
