"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { ChecklistEntry } from "@/components/capture-checklist";
import { formatLevel, type RouteLocation, toggleLabel } from "@/components/living-dex-shared";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { spriteBox } from "@/components/ui";
import type { SpeciesLocation } from "@/lib/data/encounters";

type Props = {
  /** Pokémon du Pokédex, déjà filtrés par la recherche. */
  entries: ChecklistEntry[];
  captured: Set<number>;
  route: RouteLocation[];
  /** Lieux où tout est attrapé réduits à leur nom. */
  hideDone: boolean;
  coverageNote: string | null;
  onToggle: (entry: ChecklistEntry) => void;
};

type Encounter = { entry: ChecklistEntry; location: SpeciesLocation };
type Stop = { location: SpeciesLocation; region: string; encounters: Encounter[] };

const collator = new Intl.Collator("fr", { numeric: true });

/** Lieux où l'on rencontre au moins un Pokémon du Pokédex, dans l'ordre du jeu ; ceux hors de la liste à la fin. */
function buildStops(entries: ChecklistEntry[], route: RouteLocation[]): Stop[] {
  const byLocation = new Map<number, Encounter[]>();
  for (const entry of entries) {
    for (const location of entry.locations) byLocation.set(location.id, [...(byLocation.get(location.id) ?? []), { entry, location }]);
  }
  const regions = new Map(route.map((location) => [location.id, location.region]));
  const ordered = route.filter((location) => byLocation.has(location.id)).map((location) => byLocation.get(location.id)!);
  const others = [...byLocation.entries()]
    .filter(([id]) => !regions.has(id))
    .map(([, encounters]) => encounters)
    .sort((a, b) => collator.compare(a[0].location.nameFr, b[0].location.nameFr));
  return [...ordered, ...others].map((encounters) => {
    const { location } = encounters[0];
    return { location, region: regions.get(location.id) ?? "Autres lieux", encounters };
  });
}

/** Le living dex lieu par lieu, dans l'ordre du jeu : ce qu'il reste à attraper à chaque arrêt, cochable sur place. */
export function LivingDexRoute({ entries, captured, route, hideDone, coverageNote, onToggle }: Props) {
  const stops = buildStops(entries, route);
  const offRoute = entries.filter((entry) => entry.locations.length === 0 && !captured.has(entry.species.id));
  if (stops.length === 0 && offRoute.length === 0) return <p className="text-ink-2">Aucun Pokémon ne correspond.</p>;

  // Prochain arrêt : le premier lieu où il reste à attraper ; la région s'affiche quand elle change.
  const views = stops.map((stop) => {
    const missing = stop.encounters.filter(({ entry }) => !captured.has(entry.species.id));
    const caughtHere = stop.encounters.filter(({ entry }) => captured.has(entry.species.id));
    return { ...stop, missing, caughtHere, done: missing.length === 0 };
  });
  const nextId = views.find((stop) => !stop.done)?.location.id;

  return (
    <ol className="flex flex-col">
      {views.map(({ location, region, missing, caughtHere, done }, i) => {
        const isNext = location.id === nextId;
        const regionLabel = i === 0 || views[i - 1].region !== region ? region : null;

        return [
          regionLabel && (
            <li key={`region-${location.id}`} className="flex gap-4">
              <RouteRail />
              <p className="pb-3 t-caption font-bold text-ink-3">{regionLabel}</p>
            </li>
          ),
          <li key={location.id} className="flex gap-4">
            <RouteRail
              dot={
                <span
                  className={`mt-1.5 size-3.5 shrink-0 rounded-full ${isNext ? "bg-game ring-4 ring-game-soft" : done ? "border-2 border-line-strong bg-surface" : "bg-ink"}`}
                />
              }
            />
            <div className="flex min-w-0 flex-1 flex-col gap-3 pb-5">
              <div className="-mt-[3px] flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className={`font-display font-bold ${done ? "text-base text-ink-2" : "text-xl"}`}>
                  <Link href={`/rencontres/${location.versionSlug}/${location.slug}`} className="hover:underline">
                    {location.nameFr}
                  </Link>
                </h3>
                {isNext && (
                  <span className="inline-flex h-6 items-center self-center rounded-full bg-game px-2.5 text-xs font-bold text-on-game">Prochain arrêt</span>
                )}
                <span className="text-[13px] text-ink-2">
                  {done
                    ? "Tout est attrapé"
                    : `${missing.length} à attraper${caughtHere.length > 0 ? ` · ${caughtHere.length} déjà attrapé${caughtHere.length > 1 ? "s" : ""}` : ""}`}
                </span>
              </div>
              {!done && (
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
                  {missing.map(({ entry, location: here }) => (
                    <li key={entry.species.id}>
                      <MissingCard
                        entry={entry}
                        detail={`${here.methods.join(", ")} · ${formatLevel(here.minLevel, here.maxLevel)}`}
                        onToggle={() => onToggle(entry)}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {caughtHere.length > 0 && !(done && hideDone) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-xs text-ink-3">Déjà attrapés ici</span>
                  {caughtHere.map(({ entry }) => (
                    <button
                      key={entry.species.id}
                      type="button"
                      onClick={() => onToggle(entry)}
                      aria-label={toggleLabel(entry.species.nameFr, true)}
                      title={entry.species.nameFr}
                      className="grid size-9 place-items-center rounded-full bg-surface-2 transition-colors hover:bg-line"
                    >
                      <PokemonSprite pokemonId={entry.species.pokemonId} fallbackId={entry.species.id} alt="" size={32} className="size-[30px] object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </li>,
        ];
      })}

      {offRoute.length > 0 && (
        <li className="flex gap-4">
          <RouteRail dot={<span className="mt-1.5 size-3.5 shrink-0 rounded-[4px] border-2 border-dashed border-line-strong" />} last />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="-mt-[3px] flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="font-display text-xl font-bold">{coverageNote ? "Sans lieu connu" : "Hors des hautes herbes"}</h3>
              <span className="text-[13px] text-ink-2">
                {coverageNote ? `${offRoute.length} à attraper` : `${offRoute.length} par évolution, œuf, cadeau ou échange`}
              </span>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
              {offRoute.map((entry) => (
                <li key={entry.species.id}>
                  <MissingCard
                    entry={entry}
                    detail={
                      coverageNote
                        ? "Lieu inconnu pour ce jeu"
                        : entry.species.evolvesFromNameFr
                          ? `Évolution de ${entry.species.evolvesFromNameFr}`
                          : "Œuf, cadeau, échange ou événement"
                    }
                    onToggle={() => onToggle(entry)}
                  />
                </li>
              ))}
            </ul>
          </div>
        </li>
      )}
    </ol>
  );
}

/** Colonne de gauche : le point de l'arrêt puis le trait jusqu'au suivant. */
function RouteRail({ dot, last = false }: { dot?: ReactNode; last?: boolean }) {
  return (
    <div aria-hidden className="flex w-6 shrink-0 flex-col items-center">
      {dot}
      {!last && <span className="w-0.5 flex-1 bg-line" />}
    </div>
  );
}

/** Pokémon à attraper : un clic le coche. */
function MissingCard({ entry, detail, onToggle }: { entry: ChecklistEntry; detail: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={toggleLabel(entry.species.nameFr, false)}
      className="group flex w-full min-w-0 items-center gap-3 rounded-2xl border border-line bg-surface py-2 pr-3 pl-2 text-left transition-colors hover:border-line-strong"
    >
      <span className={`${spriteBox} size-12 rounded-[14px]`}>
        <PokemonSprite pokemonId={entry.species.pokemonId} fallbackId={entry.species.id} alt="" size={48} className="size-[42px] object-contain" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm leading-5 font-bold">{entry.species.nameFr}</span>
        <span className="truncate text-xs text-ink-2">{detail}</span>
      </span>
      <span aria-hidden className="size-[22px] shrink-0 rounded-full border-[1.5px] border-line-strong transition-colors group-hover:border-ink" />
    </button>
  );
}
