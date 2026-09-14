"use cache";

import { cacheLife, cacheTag } from "next/cache";
import type { CoverageStatus } from "@/generated/prisma/enums";
import { DLC_BASE_VERSION, isDlcVersion, isHiddenVersion } from "@/lib/data/filters";
import { prisma } from "@/lib/prisma";

// Une « page Pokédex » (/pokedex/kanto) regroupe les Pokédex principaux qui partagent
// les mêmes jeux : Galar + Isolarmure + Couronneige, Alola + ses quatre îles, Kalos et
// ses trois volets… Le premier Pokédex (id le plus petit) est le principal : c'est lui
// qui donne le titre, le nombre d'entrées et l'avancement affiché dans la liste.

/** Slug d'URL par Pokédex principal ; à défaut, le slug PokeAPI (« original-johto ») est utilisé. */
const PAGE_SLUGS: Record<string, string> = {
  national: "national",
  kanto: "kanto",
  "original-johto": "johto",
  hoenn: "hoenn",
  "original-sinnoh": "sinnoh",
  "extended-sinnoh": "sinnoh-platine",
  "updated-johto": "johto-hgss",
  "original-unova": "unys",
  "updated-unova": "unys-2",
  "kalos-central": "kalos",
  "updated-hoenn": "hoenn-rosa",
  "original-alola": "alola",
  "updated-alola": "alola-ultra",
  "letsgo-kanto": "kanto-lets-go",
  galar: "galar",
  hisui: "hisui",
  paldea: "paldea",
  "lumiose-city": "illumis",
};

export type PokedexPageGame = {
  id: number;
  slug: string;
  nameFr: string;
  versionGroupSlug: string;
  coverage: CoverageStatus;
};

export type PokedexPageDex = {
  id: number;
  slug: string;
  nameFr: string;
  entryCount: number;
};

export type PokedexPage = {
  slug: string;
  /** Nom de la région (« Kanto »), ou du Pokédex pour le national. */
  title: string;
  generation: { id: number; nameFr: string } | null;
  /** Jeux couverts, sans les versions masquées ni les « versions » DLC. Vide pour le national. */
  games: PokedexPageGame[];
  /** Pokédex de la page, le principal en premier. */
  dexes: PokedexPageDex[];
  /** Nombre d'entrées du Pokédex principal. */
  count: number;
  /** Formes par défaut des entrées 1, 4 et 7 (les starters dans presque tous les Pokédex), pour la vignette. */
  sprites: { pokemonId: number; nameFr: string }[];
};

type RawPokedex = {
  id: number;
  slug: string;
  nameFr: string;
  region: { nameFr: string } | null;
  _count: { entries: number };
  versionGroups: {
    versionGroup: {
      id: number;
      slug: string;
      order: number;
      generation: { id: number; nameFr: string };
      versions: {
        id: number;
        slug: string;
        nameFr: string;
        coverage: { status: CoverageStatus } | null;
      }[];
    };
  }[];
  entries: { species: { nameFr: string; pokemons: { id: number }[] } }[];
};

async function loadPokedexes(): Promise<RawPokedex[]> {
  return prisma.pokedex.findMany({
    where: { isMainSeries: true },
    orderBy: { id: "asc" },
    select: {
      id: true,
      slug: true,
      nameFr: true,
      region: { select: { nameFr: true } },
      _count: { select: { entries: true } },
      versionGroups: {
        select: {
          versionGroup: {
            select: {
              id: true,
              slug: true,
              order: true,
              generation: { select: { id: true, nameFr: true } },
              versions: {
                orderBy: { id: "asc" },
                select: {
                  id: true,
                  slug: true,
                  nameFr: true,
                  coverage: { select: { status: true } },
                },
              },
            },
          },
        },
      },
      entries: {
        where: { number: { in: [1, 4, 7] } },
        orderBy: { number: "asc" },
        select: {
          species: {
            select: {
              nameFr: true,
              pokemons: { where: { isDefault: true }, select: { id: true } },
            },
          },
        },
      },
    },
  });
}

/** Regroupe les Pokédex reliés par un groupe de versions commun (union-find sur les ids). */
function groupPokedexes(pokedexes: RawPokedex[]): RawPokedex[][] {
  const parent = new Map<number, number>();
  const find = (id: number): number => {
    const p = parent.get(id) ?? id;
    if (p === id) return id;
    const root = find(p);
    parent.set(id, root);
    return root;
  };
  const union = (a: number, b: number) => parent.set(find(a), find(b));

  const byVersionGroup = new Map<number, number>();
  for (const pokedex of pokedexes) {
    for (const { versionGroup } of pokedex.versionGroups) {
      const first = byVersionGroup.get(versionGroup.id);
      if (first === undefined) byVersionGroup.set(versionGroup.id, pokedex.id);
      else union(pokedex.id, first);
    }
  }

  const groups = new Map<number, RawPokedex[]>();
  for (const pokedex of pokedexes) {
    const root = find(pokedex.id);
    groups.set(root, [...(groups.get(root) ?? []), pokedex]);
  }
  // Le principal = id le plus petit ; les pages dans l'ordre des principaux.
  return [...groups.values()].map((g) => g.sort((a, b) => a.id - b.id)).sort((a, b) => a[0].id - b[0].id);
}

/** « Kalos : Côtes » → « Côtes », « Mele-Mele original » → « Mele-Mele » : la page porte déjà la région et l'époque. */
function shortDexName(nameFr: string, region: string) {
  return nameFr
    .replace(`${region} : `, "")
    .replace(/ (original|mis à jour|initial|amélioré|étendu)$/, "")
    .trim();
}

function toPage(group: RawPokedex[]): PokedexPage {
  const primary = group[0];
  const versionGroups = group
    .flatMap((p) => p.versionGroups.map((vg) => vg.versionGroup))
    .filter((vg, index, all) => all.findIndex((o) => o.id === vg.id) === index)
    .sort((a, b) => a.order - b.order);

  const games = versionGroups
    .flatMap((vg) => vg.versions.map((v) => ({ ...v, versionGroupSlug: vg.slug })))
    .filter((v) => !isHiddenVersion(v.slug) && !isDlcVersion(v.slug))
    .sort((a, b) => a.id - b.id)
    .map((v) => ({
      id: v.id,
      slug: v.slug,
      nameFr: v.nameFr,
      versionGroupSlug: v.versionGroupSlug,
      coverage: v.coverage?.status ?? "NONE",
    }));

  const title = primary.region?.nameFr ?? primary.nameFr;
  return {
    slug: PAGE_SLUGS[primary.slug] ?? primary.slug,
    title,
    generation: versionGroups[0]?.generation ?? null,
    games,
    dexes: group.map((p) => ({ id: p.id, slug: p.slug, nameFr: shortDexName(p.nameFr, title), entryCount: p._count.entries })),
    count: primary._count.entries,
    sprites: primary.entries.flatMap((e) => (e.species.pokemons[0] ? [{ pokemonId: e.species.pokemons[0].id, nameFr: e.species.nameFr }] : [])),
  };
}

/** Toutes les pages Pokédex, le national en premier puis par génération. */
export async function getPokedexPages(): Promise<PokedexPage[]> {
  cacheLife("max");
  cacheTag("reference");

  const pokedexes = await loadPokedexes();
  const pages = groupPokedexes(pokedexes).map(toPage);
  const regional = pages.filter((p) => p.slug !== "national" && p.games.length > 0).sort((a, b) => (a.generation?.id ?? 0) - (b.generation?.id ?? 0));

  const national = pages.find((p) => p.slug === "national");
  if (!national) return regional;
  // Les jeux sans Pokédex régional (Colosseum, XD) se suivent dans le national.
  const orphans = await prisma.versionGroup.findMany({
    where: { pokedexes: { none: { pokedex: { isMainSeries: true } } } },
    orderBy: { order: "asc" },
    select: {
      slug: true,
      versions: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          slug: true,
          nameFr: true,
          coverage: { select: { status: true } },
        },
      },
    },
  });
  national.games = orphans
    .flatMap((vg) =>
      vg.versions.map((v) => ({
        id: v.id,
        slug: v.slug,
        nameFr: v.nameFr,
        versionGroupSlug: vg.slug,
        coverage: v.coverage?.status ?? "NONE",
      })),
    )
    .filter((v) => !isHiddenVersion(v.slug) && !isDlcVersion(v.slug) && v.slug !== "champions");
  return [national, ...regional];
}

export async function getPokedexPage(slug: string): Promise<PokedexPage | null> {
  cacheLife("max");
  cacheTag("reference");
  const pages = await getPokedexPages();
  return pages.find((p) => p.slug === slug) ?? null;
}

export async function getPokedexPageSlugs(): Promise<string[]> {
  cacheLife("max");
  cacheTag("reference");
  return (await getPokedexPages()).map((p) => p.slug);
}

/** Lien vers la page Pokédex d'un jeu, par slug de version : « /pokedex/kanto?jeu=red ». */
export async function getPokedexHrefs(): Promise<Record<string, string>> {
  cacheLife("max");
  cacheTag("reference");

  const pages = await getPokedexPages();
  const hrefs: Record<string, string> = {};
  for (const page of pages) {
    for (const game of page.games) hrefs[game.slug] = `/pokedex/${page.slug}?jeu=${game.slug}`;
  }
  // Les « versions » DLC suivent leur jeu de base ; Colosseum / XD n'ont que le national.
  const versions = await prisma.version.findMany({ select: { slug: true } });
  for (const { slug } of versions) hrefs[slug] ??= hrefs[DLC_BASE_VERSION[slug]] ?? "/pokedex/national";
  return hrefs;
}

/** Espèces d'un Pokédex, dans l'ordre du Pokédex. */
export async function getPokedexSpeciesIds(pokedexId: number): Promise<number[]> {
  cacheLife("max");
  cacheTag("reference");
  const entries = await prisma.pokedexEntry.findMany({
    where: { pokedexId },
    orderBy: { number: "asc" },
    select: { speciesId: true },
  });
  return entries.map((e) => e.speciesId);
}
