import "server-only";

import Link from "next/link";
import { notFound } from "next/navigation";
import type { ChecklistEntry } from "@/components/capture-checklist";
import type { RouteLocation } from "@/components/living-dex-shared";
import { chip } from "@/components/ui";
import { getVersionLocations, getVersionSpeciesLocations, type SpeciesLocation } from "@/lib/data/encounters";
import { getVersionBySlug } from "@/lib/data/games";
import { getPokedexBySlug } from "@/lib/data/pokedex";

// Commun au living dex et au shiny dex d'un jeu : le Pokédex choisi (`?dex=`) et où trouver chaque Pokémon.

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type DexLink = { id: number; slug: string; nameFr: string };

/** Pokédex du jeu à afficher, ses entrées avec leurs lieux de rencontre, et la note de couverture. */
export async function loadGameDex(slug: string, searchParams: SearchParams) {
  const version = await getVersionBySlug(slug);
  if (!version) notFound();

  // Même repli que le Pokédex du jeu : national pour Colosseum / XD.
  const pokedexes: DexLink[] = version.pokedexes.length > 0 ? version.pokedexes : [{ id: 1, slug: "national", nameFr: "National" }];
  const { dex } = await searchParams;
  const current = (typeof dex === "string" && pokedexes.find((p) => p.slug === dex)) || pokedexes[0];
  const coverage = version.coverage;

  const [pokedex, locations] = await Promise.all([
    getPokedexBySlug(current.slug),
    coverage?.status === "NONE" ? ({} as Record<number, SpeciesLocation[]>) : getVersionSpeciesLocations(version.id),
  ]);
  if (!pokedex) notFound();

  const entries: ChecklistEntry[] = pokedex.entries.map((entry) => ({ ...entry, locations: locations[entry.species.id] ?? [] }));
  const coverageNote = coverage?.status === "FULL" ? null : (coverage?.note ?? "Lieux de rencontre indisponibles pour ce jeu.");
  return { version, pokedexes, current, title: `Pokédex ${pokedex.nameFr}`, entries, coverageNote };
}

/** Lieux du jeu dans l'ordre où on les découvre, avec leur région : le fil de l'itinéraire du living dex. */
export async function loadGameRoute(slug: string): Promise<RouteLocation[]> {
  const locations = await getVersionLocations(slug);
  return locations?.groups.flatMap((group) => group.locations.map((location) => ({ id: location.id, region: group.region }))) ?? [];
}

/** Choix du Pokédex quand le jeu en a plusieurs (Paldea, Kitakami, Myrtille…). */
export function DexChips({ pokedexes, current, href }: { pokedexes: DexLink[]; current: DexLink; href: (dex: string) => string }) {
  if (pokedexes.length < 2) return null;
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Pokédex du jeu">
      {pokedexes.map((p) => {
        const active = p.slug === current.slug;
        return (
          <Link key={p.id} href={href(p.slug)} aria-current={active ? "page" : undefined} className={chip(active)}>
            {p.nameFr}
          </Link>
        );
      })}
    </nav>
  );
}
