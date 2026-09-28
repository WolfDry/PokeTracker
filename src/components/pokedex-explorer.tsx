"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
import { CheckIcon, ChevronDownIcon, MapIcon, SearchIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { ToolbarSelect } from "@/components/toolbar-select";
import { ProgressBar } from "@/components/progress-bar";
import { TypeDots } from "@/components/type-badge";
import { card, cardLink, checkCircle, chip, chipCount, dexNumber, input, primaryButton, secondaryButton, textLink } from "@/components/ui";
import { useCaptures } from "@/components/use-captures";
import type { PokedexGridEntry } from "@/lib/data/pokedex";
import type { PokedexPage, PokedexPageGame } from "@/lib/data/pokedex-pages";
import { pokedexPageTitle } from "@/lib/pokedex-title";

type Props = {
  page: PokedexPage;
  /** Jeu sélectionné (`?jeu=`) ; absent sur le national tant qu'aucun jeu n'est choisi. */
  game: PokedexPageGame | null;
  dex: { slug: string; nameFr: string };
  entries: PokedexGridEntry[];
  /** Pokémon du jeu hors de ce Pokédex (liste curée), numérotés selon le national. */
  extras: PokedexGridEntry[];
  /** Espèces cochées dans le jeu ; `null` = personne n'est connecté. */
  captured: number[] | null;
  loginNext: string;
};

type Status = "all" | "caught" | "missing";

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Page d'un Pokédex : en-tête avec avancement, barre d'outils (jeu, Pokédex, recherche, filtres) et grille de cartes. */
export function PokedexExplorer({ page, game, dex, entries, extras, captured, loginNext }: Props) {
  const signedIn = captured !== null && game !== null;
  const captures = useCaptures(game?.id ?? 0, captured ?? []);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [type, setType] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const router = useRouter();

  const caughtCount = signedIn ? entries.filter((e) => captures.captured.has(e.species.id)).length : 0;

  const types = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of [...entries, ...extras]) for (const t of e.species.types) map.set(t.slug, t.nameFr);
    return [...map].map(([slug, nameFr]) => ({ slug, nameFr })).sort((a, b) => a.nameFr.localeCompare(b.nameFr, "fr"));
  }, [entries, extras]);

  const matches = (entry: PokedexGridEntry) => {
    if (status !== "all" && captures.captured.has(entry.species.id) !== (status === "caught")) return false;
    if (type && !entry.species.types.some((t) => t.slug === type)) return false;
    if (query) {
      const q = normalize(query.trim());
      if (!normalize(entry.species.nameFr).includes(q) && !String(entry.number).includes(q)) return false;
    }
    return true;
  };
  const shown = entries.filter(matches);
  const shownExtras = extras.filter(matches);
  const activeFilters = (status !== "all" ? 1 : 0) + (type ? 1 : 0);

  const resetFilters = () => {
    setStatus("all");
    setType(null);
  };

  const gameHref = (g: PokedexPageGame) => `/pokedex/${page.slug}?jeu=${g.slug}${dex.slug !== page.dexes[0].slug ? `&dex=${dex.slug}` : ""}`;
  const dexHref = (d: { slug: string }) => `/pokedex/${page.slug}?${game ? `jeu=${game.slug}&` : ""}dex=${d.slug}`;

  const statusChips = (
    <>
      {(
        [
          ["all", "Tous", entries.length],
          ["caught", "Attrapés", caughtCount],
          ["missing", "Manquants", entries.length - caughtCount],
        ] as const
      ).map(([key, label, count]) => (
        <button
          key={key}
          type="button"
          className={`${chip(status === key)} disabled:pointer-events-none disabled:opacity-40`}
          aria-pressed={status === key}
          onClick={() => setStatus(key)}
          disabled={!signedIn && key !== "all"}
        >
          {label} <span className={chipCount(status === key)}>{count}</span>
        </button>
      ))}
    </>
  );
  const gameChips = page.games.map((g) => (
    <Link key={g.id} href={gameHref(g)} className={chip(g.id === game?.id)} aria-current={g.id === game?.id ? "page" : undefined}>
      {g.nameFr}
    </Link>
  ));
  const dexChips = page.dexes.map((d) => (
    <Link key={d.id} href={dexHref(d)} className={chip(d.slug === dex.slug)} aria-current={d.slug === dex.slug ? "page" : undefined}>
      {d.nameFr} <span className={chipCount(d.slug === dex.slug)}>{d.entryCount}</span>
    </Link>
  ));
  const searchField = (
    <div className="relative flex-1 sm:w-60 sm:flex-none">
      <SearchIcon size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Nom ou n°…"
        aria-label={`Chercher dans le Pokédex ${dex.nameFr}`}
        autoComplete="off"
        className={`${input} h-10 rounded-full border-line pl-9 text-sm sm:h-9`}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={page.generation ? `${page.generation.nameFr} · ${page.title}` : "Toutes les générations"}
        title={pokedexPageTitle(page)}
        intro={
          <p className="t-small">
            {entries.length} Pokémon
            {page.slug === "national" ? " · tous les jeux" : ` · ${page.games.map((g) => g.nameFr).join(", ")}`}
          </p>
        }
        actions={
          game && (
            <div className={`${card} flex w-full items-center gap-5 py-3 pr-4 pl-5 sm:min-w-80`}>
              <div className="flex-1 space-y-1.5">
                {signedIn ? (
                  <ProgressBar caught={caughtCount} total={entries.length} label={`Attrapés dans ${game.nameFr}`} />
                ) : (
                  <p className="t-small text-ink-2">
                    <Link href={`/connexion?next=${encodeURIComponent(loginNext)}`} className={textLink}>
                      Connecte-toi
                    </Link>{" "}
                    pour cocher tes captures dans {game.nameFr}.
                  </p>
                )}
              </div>
              {game.coverage !== "NONE" && (
                <Link href={`/rencontres/${game.slug}`} className={`${secondaryButton} h-9 px-3`}>
                  <MapIcon size={18} /> Lieux
                </Link>
              )}
            </div>
          )
        }
      />

      {/* Barre d'outils desktop : collante sous l'en-tête du site. */}
      <div className="sticky top-16 z-10 -mx-10 hidden items-center gap-6 border-b border-line bg-page/90 px-10 py-3 backdrop-blur sm:flex">
        {searchField}
        {page.games.length > 0 && (
          <ToolbarSelect
            label="Jeu"
            value={game?.slug ?? ""}
            onChange={(slug) => {
              const target = page.games.find((g) => g.slug === slug);
              if (target) router.push(gameHref(target));
            }}
            options={page.games.map((g) => ({ value: g.slug, label: g.nameFr }))}
            placeholder={game ? undefined : "Choisir un jeu"}
          />
        )}
        {page.dexes.length > 1 && (
          <ToolbarSelect
            label="Pokédex"
            value={dex.slug}
            onChange={(slug) => router.push(dexHref({ slug }))}
            options={page.dexes.map((d) => ({ value: d.slug, label: `${d.nameFr} · ${d.entryCount}` }))}
          />
        )}
        <div className="ml-auto flex items-center gap-1.5" role="group" aria-label="Filtrer">
          {statusChips}
          <ToolbarSelect
            label="Type"
            value={type ?? ""}
            onChange={(slug) => setType(slug || null)}
            options={types.map((t) => ({ value: t.slug, label: t.nameFr }))}
            placeholder="Tous"
            highlight={type !== null}
          />
        </div>
      </div>

      {/* Mobile : recherche + bouton « Filtres » qui ouvre un panneau par-dessus la grille. */}
      <div className="relative sm:hidden">
        <div className="flex gap-2">
          {searchField}
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            className={`${filtersOpen ? primaryButton : secondaryButton} gap-1.5 px-3.5`}
          >
            Filtres
            {activeFilters > 0 && (
              <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs ${filtersOpen ? "bg-on-ink text-ink" : "bg-ink text-on-ink"}`}>
                {activeFilters}
              </span>
            )}
            <ChevronDownIcon size={14} className={filtersOpen ? "rotate-180" : ""} />
          </button>
        </div>
        {filtersOpen && (
          <div className={`${card} absolute inset-x-0 top-full z-10 mt-2 overflow-hidden shadow-float`}>
            {page.games.length > 0 && <FilterSection label="Jeu">{gameChips}</FilterSection>}
            {page.dexes.length > 1 && <FilterSection label="Pokédex">{dexChips}</FilterSection>}
            <FilterSection label="Statut">{statusChips}</FilterSection>
            <FilterSection label="Type">
              <button type="button" className={chip(type === null)} aria-pressed={type === null} onClick={() => setType(null)}>
                Tous
              </button>
              {types.map((t) => (
                <button key={t.slug} type="button" className={`${chip(type === t.slug)} pl-2`} aria-pressed={type === t.slug} onClick={() => setType(t.slug)}>
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{
                      background: `var(--type-${t.slug}, var(--type-unknown))`,
                    }}
                  />
                  {t.nameFr}
                </button>
              ))}
            </FilterSection>
            <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-2 px-4 py-3">
              <button type="button" onClick={resetFilters} className={`${textLink} t-small text-ink-2`}>
                Réinitialiser
              </button>
              <button type="button" onClick={() => setFiltersOpen(false)} className={primaryButton}>
                Voir {shown.length + shownExtras.length} Pokémon
              </button>
            </div>
          </div>
        )}
      </div>

      {captures.error && (
        <p role="alert" className="t-small text-danger">
          {captures.error}
        </p>
      )}

      {shown.length === 0 && shownExtras.length === 0 ? (
        <p className="text-ink-2">
          {status === "caught" && !query && !type
            ? "Aucun Pokémon attrapé pour l'instant."
            : status === "missing" && !query && !type
              ? "Pokédex complet, bravo !"
              : "Aucun Pokémon ne correspond."}
        </p>
      ) : (
        <Grid entries={shown} captures={captures} signedIn={signedIn} />
      )}

      {game && extras.length > 0 && shownExtras.length > 0 && (
        <section className="space-y-4 border-t border-line pt-8">
          <div className="flex items-baseline justify-between gap-4">
            <div className="space-y-1">
              <h2 className="t-h2">
                Aussi dans {game.nameFr}, hors Pokédex {dex.nameFr}
              </h2>
              <p className="t-small text-ink-2">Après le Pokédex national : zones de fin de jeu, événements et échanges. Numérotés selon le national.</p>
            </div>
            <span className="t-small text-ink-2">{shownExtras.length} Pokémon</span>
          </div>
          <Grid entries={shownExtras} captures={captures} signedIn={signedIn} />
        </section>
      )}
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2.5 border-t border-line px-4 py-3.5 first:border-t-0">
      <p className="t-caption">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

type GridProps = {
  entries: PokedexGridEntry[];
  captures: ReturnType<typeof useCaptures>;
  signedIn: boolean;
};

/** Cartes « affiche » : le sprite en vedette, le numéro en filigrane, les types en points, la case en haut à droite. */
function Grid({ entries, captures, signedIn }: GridProps) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {entries.map((entry) => {
        const caught = signedIn && captures.captured.has(entry.species.id);
        return (
          <li key={entry.species.id} className={`${cardLink} relative overflow-hidden`}>
            <span
              aria-hidden
              className="absolute top-1 left-3 text-[32px] leading-none font-extrabold tracking-[-0.04em] text-surface-2 select-none sm:text-[44px]"
            >
              {dexNumber(entry.number)}
            </span>
            <Link href={`/pokemon/${entry.species.id}`} className="relative flex flex-col items-center gap-2 px-3 pt-6 pb-4 sm:gap-3 sm:pt-8">
              <PokemonSprite pokemonId={entry.species.pokemonId} alt={entry.species.nameFr} size={160} className="size-28 sm:size-40" />
              <span className="flex flex-col items-center gap-1.5">
                <span className="text-[15px] leading-5 font-bold tracking-[-0.01em] sm:text-[17px] sm:leading-[22px]">{entry.species.nameFr}</span>
                <TypeDots types={entry.species.types} />
              </span>
            </Link>
            {signedIn && (
              <button
                type="button"
                onClick={() => captures.toggle(entry.species.id)}
                aria-pressed={caught}
                aria-label={`${caught ? "Retirer" : "Marquer"} ${entry.species.nameFr} ${caught ? "des captures" : "comme attrapé"}`}
                title={caught ? "Attrapé — cliquer pour retirer" : "Marquer comme attrapé"}
                className="absolute top-1 right-1 grid size-11 place-items-center"
              >
                <span className={`${checkCircle(caught)} size-7`}>
                  <CheckIcon />
                </span>
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
