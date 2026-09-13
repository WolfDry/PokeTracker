"use client";

import Link from "next/link";
import { Fragment, type ReactNode, useMemo, useState } from "react";
import { PokemonSprite } from "@/components/pokemon-sprite";
import {
  formatLevels,
  ROD_METHOD_SLUGS,
  type EncounterArea,
  type EncounterConditionRef,
  type EncounterRow,
  type LocationEncounterTable,
} from "@/lib/encounters";

type Props = {
  table: LocationEncounterTable;
  /** Le jeu demandé est toujours `table.versions[0]`. */
  currentVersionName: string;
};

/** Au-delà de ce nombre de lignes, seule la première zone est dépliée au chargement (Terres Sauvages : 20 antres…). */
const COLLAPSE_THRESHOLD = 200;

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-sm transition-colors ${
    active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card hover:border-accent"
  }`;

type KeyedRow = { row: EncounterRow; key: number };
/** Toutes les façons de trouver une espèce dans la zone (méthodes, formes, conditions), dans l'ordre du tri serveur. */
type SpeciesGroup = { speciesId: number; rows: KeyedRow[] };

function groupBySpecies(rows: KeyedRow[], pokemons: LocationEncounterTable["pokemons"]): SpeciesGroup[] {
  const groups = new Map<number, SpeciesGroup>();
  for (const entry of rows) {
    const speciesId = pokemons[entry.row.pokemonId].speciesId;
    const group = groups.get(speciesId) ?? { speciesId, rows: [] };
    group.rows.push(entry);
    groups.set(speciesId, group);
  }
  return [...groups.values()];
}

/** Tableau des rencontres d'un lieu, par sous-zone, avec filtres côté client (instantanés). */
export function EncounterTable({ table, currentVersionName }: Props) {
  const { versions, methods, conditions, areas } = table;
  const hasTwins = versions.length > 1;
  const rodMethodIds = useMemo(() => new Set(methods.filter((m) => ROD_METHOD_SLUGS.has(m.slug)).map((m) => m.id)), [methods]);
  const methodById = useMemo(() => new Map(methods.map((m) => [m.id, m])), [methods]);
  const totalRows = useMemo(() => areas.reduce((sum, area) => sum + area.rows.length, 0), [areas]);

  const [onlyCurrent, setOnlyCurrent] = useState(false);
  const [hideRods, setHideRods] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState<Set<number>>(new Set());
  const [openAreas, setOpenAreas] = useState<Set<number>>(
    () => new Set(totalRows > COLLAPSE_THRESHOLD ? areas.slice(0, 1).map((a) => a.id) : areas.map((a) => a.id)),
  );

  const visibleVersions = onlyCurrent ? [0] : versions.map((_, index) => index);

  const keepRow = (row: EncounterRow) => {
    if (hideRods && rodMethodIds.has(row.methodId)) return false;
    if (selectedMethods.size > 0 && !selectedMethods.has(row.methodId)) return false;
    // En mode « ce jeu seulement », on masque ce qui n'existe que dans la version jumelle.
    return !onlyCurrent || row.byVersion[0] !== null;
  };
  // Les clés React viennent de l'index d'origine : stables quels que soient les filtres.
  // Une espèce = un groupe (ligne dépliable si elle se trouve de plusieurs façons).
  const filteredAreas = areas
    .map((area) => ({
      ...area,
      groups: groupBySpecies(
        area.rows.map((row, index) => ({ row, key: index })).filter(({ row }) => keepRow(row)),
        table.pokemons,
      ),
    }))
    .filter((area) => area.groups.length > 0);
  const shownRows = filteredAreas.reduce((sum, area) => sum + area.groups.length, 0);
  const showConditions = filteredAreas.some((area) =>
    area.groups.some((group) => group.rows.some(({ row }) => row.conditionIds.length + row.alternatives.length > 0)),
  );

  const toggleMethod = (id: number) =>
    setSelectedMethods((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleArea = (id: number) =>
    setOpenAreas((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Parties affichées dans la colonne Conditions : groupes « ou » et valeurs seules, dans l'ordre des conditions.
  const conditionParts = (row: EncounterRow): EncounterConditionRef[][] =>
    [...row.alternatives.map((group) => group.map((id) => conditions[id])), ...row.conditionIds.map((id) => [conditions[id]])].sort(
      (a, b) => a[0].conditionId - b[0].conditionId,
    );

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border border-border bg-card p-3">
        {hasTwins && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Versions affichées">
            <button type="button" className={chip(!onlyCurrent)} aria-pressed={!onlyCurrent} onClick={() => setOnlyCurrent(false)}>
              {versions.map((v) => v.nameFr).join(" + ")}
            </button>
            <button type="button" className={chip(onlyCurrent)} aria-pressed={onlyCurrent} onClick={() => setOnlyCurrent(true)}>
              {currentVersionName} seulement
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Méthodes de rencontre">
          <button
            type="button"
            className={chip(selectedMethods.size === 0)}
            aria-pressed={selectedMethods.size === 0}
            onClick={() => setSelectedMethods(new Set())}
          >
            Toutes les méthodes
          </button>
          {methods.map((method) => (
            <button
              key={method.id}
              type="button"
              className={chip(selectedMethods.has(method.id))}
              aria-pressed={selectedMethods.has(method.id)}
              onClick={() => toggleMethod(method.id)}
            >
              {method.nameFr}
            </button>
          ))}
          {rodMethodIds.size > 0 && (
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={hideRods} onChange={(event) => setHideRods(event.target.checked)} className="accent-accent" />
              Masquer les cannes
            </label>
          )}
        </div>
      </div>

      {shownRows === 0 ? (
        <p className="text-muted">Aucune rencontre avec ces filtres.</p>
      ) : (
        filteredAreas.map((area) => {
          const open = openAreas.has(area.id);
          return (
            <section key={area.id} className="space-y-2">
              {areas.length > 1 && (
                <h3 className="text-lg font-medium">
                  <button
                    type="button"
                    onClick={() => toggleArea(area.id)}
                    aria-expanded={open}
                    className="inline-flex items-center gap-2 text-left hover:text-accent"
                  >
                    <span aria-hidden className="text-sm text-muted">
                      {open ? "▾" : "▸"}
                    </span>
                    {area.nameFr}
                    <span className="text-sm font-normal text-muted">{area.groups.length} Pokémon</span>
                  </button>
                </h3>
              )}
              {open && (
                <AreaTable
                  area={area}
                  groups={area.groups}
                  table={table}
                  visibleVersions={visibleVersions}
                  showConditions={showConditions}
                  methodName={(id) => methodById.get(id)?.nameFr ?? "?"}
                  conditionParts={conditionParts}
                />
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

type AreaTableProps = {
  area: Pick<EncounterArea, "rates">;
  groups: SpeciesGroup[];
  table: LocationEncounterTable;
  visibleVersions: number[];
  showConditions: boolean;
  methodName: (id: number) => string;
  conditionParts: (row: EncounterRow) => EncounterConditionRef[][];
};

/** "5 %" ou "5–95 %" selon les valeurs présentes ; `null` si aucune. */
const formatRates = (rates: number[]) => {
  if (rates.length === 0) return null;
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  return min === max ? `${min} %` : `${min}–${max} %`;
};

function AreaTable({ area, groups, table, visibleVersions, showConditions, methodName, conditionParts }: AreaTableProps) {
  const { versions, pokemons } = table;
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set());
  const toggleGroup = (speciesId: number) =>
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(speciesId)) next.delete(speciesId);
      else next.add(speciesId);
      return next;
    });

  // Fréquence globale des méthodes dans la zone, pour le jeu demandé.
  const areaRates = area.rates
    .filter((r) => r.versionId === versions[0].id)
    .sort((a, b) => a.methodId - b.methodId)
    .map((r) => `${methodName(r.methodId)} ${r.rate}`);

  const rateCells = (byVersion: (string | null)[]) =>
    visibleVersions.map((index) => {
      const rate = byVersion[index];
      return (
        <td key={versions[index].id} className={`px-3 py-1.5 text-right tabular-nums ${rate === null ? "text-muted" : ""}`}>
          {rate ?? "—"}
        </td>
      );
    });

  const levelCell = (row: EncounterRow) => {
    const present = visibleVersions.map((index) => row.byVersion[index]).filter((v) => v !== null);
    const levels = [...new Set(present.map(([, min, max]) => formatLevels(min, max)))];
    return (
      <td className="px-3 py-1.5 whitespace-nowrap tabular-nums">
        {levels.length === 1
          ? levels[0]
          : // Niveaux différents selon la version : on les détaille.
            visibleVersions.map((index) => {
              const v = row.byVersion[index];
              return v ? (
                <span key={versions[index].id} className="block">
                  <span className="text-xs text-muted">{versions[index].nameFr} </span>
                  {formatLevels(v[1], v[2])}
                </span>
              ) : null;
            })}
      </td>
    );
  };

  const conditionCell = (row: EncounterRow) => (
    <td className="px-3 py-1.5 text-xs">
      {conditionParts(row).map((part, i) => (
        <span key={part[0].id} className={part.every((c) => c.isDefault) ? "text-muted" : ""}>
          {i > 0 && <span className="text-muted"> · </span>}
          {part.map((c) => c.nameFr).join(" / ")}
        </span>
      ))}
    </td>
  );

  const pokemonCell = (pokemonId: number, label: string, formName: string | null, extra?: ReactNode) => (
    <td className="px-3 py-1.5">
      <span className="flex items-center gap-2">
        {extra}
        <Link href={`/pokemon/${pokemons[pokemonId].speciesId}`} className="flex items-center gap-2 hover:text-accent" onClick={(e) => e.stopPropagation()}>
          <PokemonSprite pokemonId={pokemonId} fallbackId={pokemons[pokemonId].speciesId} alt="" size={40} className="shrink-0" />
          <span>
            <span className="font-medium">{label}</span>
            {formName && <span className="block text-xs text-muted">{formName}</span>}
          </span>
        </Link>
      </span>
    </td>
  );

  return (
    <>
      {areaRates.length > 0 && (
        <p className="text-xs text-muted" title="Fréquence globale des rencontres par méthode, dans les données du jeu">
          Fréquence : {areaRates.join(" · ")}
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-background/60 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Pokémon</th>
              <th className="px-3 py-2 font-medium">Méthode</th>
              <th className="px-3 py-2 font-medium">Niveaux</th>
              {visibleVersions.map((index) => (
                <th key={versions[index].id} className={`px-3 py-2 text-right font-medium ${index === 0 ? "text-foreground" : ""}`}>
                  {visibleVersions.length > 1 ? versions[index].nameFr : "Taux"}
                </th>
              ))}
              {showConditions && <th className="px-3 py-2 font-medium">Conditions</th>}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const first = group.rows[0];
              const species = pokemons[first.row.pokemonId];

              // Une seule façon de le trouver : ligne simple, comme avant.
              if (group.rows.length === 1) {
                return (
                  <tr key={group.speciesId} className="border-t border-border align-middle">
                    {pokemonCell(first.row.pokemonId, species.nameFr, species.isDefault ? null : species.formNameFr)}
                    <td className="px-3 py-1.5 whitespace-nowrap">{methodName(first.row.methodId)}</td>
                    {levelCell(first.row)}
                    {rateCells(first.row.byVersion.map((v) => (v ? `${v[0]} %` : null)))}
                    {showConditions && conditionCell(first.row)}
                  </tr>
                );
              }

              // Plusieurs façons : ligne résumé (méthodes, plage de niveaux et de taux) dépliable en sous-lignes.
              const open = openGroups.has(group.speciesId);
              const rows = group.rows.map(({ row }) => row);
              const forms = new Set(rows.map((row) => row.pokemonId));
              const sharedForm = forms.size === 1 && !species.isDefault ? species.formNameFr : null;
              const methodNames = [...new Set(rows.map((row) => methodName(row.methodId)))];
              const present = rows.flatMap((row) => visibleVersions.map((index) => row.byVersion[index]).filter((v) => v !== null));
              const summaryRates = versions.map((_, index) => formatRates(rows.map((row) => row.byVersion[index]?.[0]).filter((r) => r !== undefined)));

              return (
                <Fragment key={group.speciesId}>
                  <tr
                    className="cursor-pointer border-t border-border align-middle hover:bg-background/40"
                    onClick={() => toggleGroup(group.speciesId)}
                  >
                    {pokemonCell(
                      first.row.pokemonId,
                      species.nameFr,
                      sharedForm,
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-label={`${open ? "Replier" : "Déplier"} les ${rows.length} façons de trouver ${species.nameFr}`}
                        className="w-4 shrink-0 text-sm text-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(group.speciesId);
                        }}
                      >
                        {open ? "▾" : "▸"}
                      </button>,
                    )}
                    <td className="px-3 py-1.5">
                      {methodNames.length <= 2 ? methodNames.join(", ") : `${methodNames.length} méthodes`}
                      <span className="block text-xs text-muted">
                        {rows.length} rencontres{forms.size > 1 ? ` · ${forms.size} formes` : ""}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap tabular-nums">
                      {present.length > 0 ? formatLevels(Math.min(...present.map((v) => v[1])), Math.max(...present.map((v) => v[2]))) : "—"}
                    </td>
                    {rateCells(summaryRates)}
                    {showConditions && <td className="px-3 py-1.5 text-xs text-muted">{open ? "" : "Voir le détail"}</td>}
                  </tr>
                  {open &&
                    group.rows.map(({ row, key }) => {
                      const pokemon = pokemons[row.pokemonId];
                      return (
                        <tr key={key} className="border-t border-border/50 bg-background/40 align-middle">
                          <td className="py-1.5 pr-3 pl-12 text-xs text-muted">
                            {forms.size > 1 ? (
                              <span className="flex items-center gap-2 text-foreground">
                                <PokemonSprite pokemonId={row.pokemonId} fallbackId={pokemon.speciesId} alt="" size={28} className="shrink-0" />
                                {pokemon.formNameFr ?? "Forme de base"}
                              </span>
                            ) : (
                              <span aria-hidden>↳</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 whitespace-nowrap">{methodName(row.methodId)}</td>
                          {levelCell(row)}
                          {rateCells(row.byVersion.map((v) => (v ? `${v[0]} %` : null)))}
                          {showConditions && conditionCell(row)}
                        </tr>
                      );
                    })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
