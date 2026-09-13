import Link from "next/link";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { TypeBadge } from "@/components/type-badge";
import type { PokedexGridEntry } from "@/lib/data/pokedex";

export function PokedexGrid({ entries }: { entries: PokedexGridEntry[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {entries.map((entry) => (
        <li key={entry.species.id}>
          <Link
            href={`/pokemon/${entry.species.id}`}
            className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 transition-colors hover:border-accent"
          >
            <PokemonSprite
              pokemonId={entry.species.pokemonId}
              alt={entry.species.nameFr}
              size={56}
              className="shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs text-muted">N° {String(entry.number).padStart(3, "0")}</div>
              <div className="truncate font-medium">{entry.species.nameFr}</div>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {entry.species.types.map((type) => (
                  <TypeBadge key={type.slug} type={type} />
                ))}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
