"use client";

import Link from "next/link";
import { useState } from "react";
import type { VersionLocationGroup } from "@/lib/data/encounters";
import { normalize } from "@/lib/search";

type Props = {
  versionSlug: string;
  groups: VersionLocationGroup[];
};

/** Liste des lieux d'un jeu, par région, avec un filtre texte instantané. */
export function LocationPicker({ versionSlug, groups }: Props) {
  const [query, setQuery] = useState("");
  const needle = normalize(query);
  const filtered = groups
    .map((group) => ({ ...group, locations: needle ? group.locations.filter((l) => normalize(l.nameFr).includes(needle)) : group.locations }))
    .filter((group) => group.locations.length > 0);

  return (
    <div className="space-y-6">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filtrer les lieux (Route 3, grotte…)"
        aria-label="Filtrer les lieux"
        className="w-full max-w-md rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
      />

      {filtered.length === 0 ? (
        <p className="text-muted">Aucun lieu ne correspond à « {query} ».</p>
      ) : (
        filtered.map((group) => (
          <section key={group.region} className="space-y-3">
            {groups.length > 1 && <h2 className="text-lg font-medium">{group.region}</h2>}
            <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {group.locations.map((location) => (
                <li key={location.id}>
                  <Link
                    href={`/rencontres/${versionSlug}/${location.slug}`}
                    className="flex items-baseline justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:border-accent"
                  >
                    <span className="font-medium">{location.nameFr}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {location.speciesCount} Pokémon
                      {location.areaCount > 1 && ` · ${location.areaCount} zones`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
