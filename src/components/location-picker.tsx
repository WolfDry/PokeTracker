"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchIcon } from "@/components/icons";
import { cardLink, input, inputHeight } from "@/components/ui";
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
    <div className="space-y-8">
      <div className="relative max-w-md">
        <SearchIcon size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filtrer les lieux (Route 3, grotte…)"
          aria-label="Filtrer les lieux"
          className={`${input} ${inputHeight} pl-9`}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-ink-2">Aucun lieu ne correspond à « {query} ».</p>
      ) : (
        filtered.map((group) => (
          <section key={group.region} className="space-y-3">
            {groups.length > 1 && <h2 className="t-h2">{group.region}</h2>}
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.locations.map((location) => (
                <li key={location.id}>
                  <Link href={`/rencontres/${versionSlug}/${location.slug}`} className={`${cardLink} flex items-baseline justify-between gap-3 px-4 py-3`}>
                    <span className="font-semibold">{location.nameFr}</span>
                    <span className="shrink-0 t-small text-ink-2">
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
