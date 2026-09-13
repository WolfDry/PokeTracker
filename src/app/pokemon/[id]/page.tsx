import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { TypeBadge } from "@/components/type-badge";
import { getSpeciesById, getSpeciesEncounters } from "@/lib/data/species";

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: PageProps<"/pokemon/[id]">): Promise<Metadata> {
  const { id } = await params;
  const speciesId = parseId(id);
  const species = speciesId ? await getSpeciesById(speciesId) : null;
  return { title: species ? `${species.nameFr} · N° ${String(species.id).padStart(4, "0")}` : "Pokémon introuvable" };
}

function formatLevel(min: number, max: number) {
  return min === max ? `Niv. ${min}` : `Niv. ${min}-${max}`;
}

export default async function SpeciesPage({ params }: PageProps<"/pokemon/[id]">) {
  const { id } = await params;
  const speciesId = parseId(id);
  if (!speciesId) notFound();

  const [species, encounters] = await Promise.all([getSpeciesById(speciesId), getSpeciesEncounters(speciesId)]);
  if (!species) notFound();

  const flags = [
    species.isLegendary && "Légendaire",
    species.isMythical && "Fabuleux",
    species.isBaby && "Bébé",
  ].filter((flag): flag is string => Boolean(flag));

  return (
    <div className="space-y-8">
      <nav className="flex gap-3 text-sm">
        {species.id > 1 && (
          <Link href={`/pokemon/${species.id - 1}`} className="text-muted hover:text-foreground">
            ← N° {String(species.id - 1).padStart(4, "0")}
          </Link>
        )}
        <Link href={`/pokemon/${species.id + 1}`} className="ml-auto text-muted hover:text-foreground">
          N° {String(species.id + 1).padStart(4, "0")} →
        </Link>
      </nav>

      <header className="flex flex-wrap items-start gap-6">
        <div className="flex gap-2 rounded-lg border border-border bg-card p-2">
          <PokemonSprite pokemonId={species.defaultPokemon.id} alt={species.nameFr} />
          <PokemonSprite pokemonId={species.defaultPokemon.id} alt={`${species.nameFr} chromatique`} shiny />
        </div>
        <div className="space-y-2">
          <div className="text-sm text-muted">N° {String(species.id).padStart(4, "0")} · {species.generation.nameFr}</div>
          <h1 className="text-3xl font-semibold">{species.nameFr}</h1>
          <div className="text-muted">
            {species.nameEn}
            {species.genusFr && ` · ${species.genusFr}`}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {species.defaultPokemon.types.map((type) => (
              <TypeBadge key={type.slug} type={type} size="md" />
            ))}
            {flags.map((flag) => (
              <span key={flag} className="rounded bg-amber-500/15 px-2.5 py-0.5 text-sm text-amber-700 dark:text-amber-300">
                {flag}
              </span>
            ))}
          </div>
          <dl className="flex gap-6 text-sm">
            {species.defaultPokemon.height !== null && (
              <div>
                <dt className="text-muted">Taille</dt>
                <dd>{(species.defaultPokemon.height / 10).toLocaleString("fr-FR")} m</dd>
              </div>
            )}
            {species.defaultPokemon.weight !== null && (
              <div>
                <dt className="text-muted">Poids</dt>
                <dd>{(species.defaultPokemon.weight / 10).toLocaleString("fr-FR")} kg</dd>
              </div>
            )}
            {species.captureRate !== null && (
              <div>
                <dt className="text-muted">Taux de capture</dt>
                <dd>{species.captureRate}</dd>
              </div>
            )}
          </dl>
        </div>
      </header>

      {species.forms.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Formes</h2>
          <ul className="flex flex-wrap gap-2">
            {species.forms.map((form) => (
              <li key={form.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 pr-3">
                <PokemonSprite pokemonId={form.id} fallbackId={species.defaultPokemon.id} alt={form.formNameFr ?? form.slug} size={56} />
                <div>
                  <div className="text-sm font-medium">{form.formNameFr ?? form.slug}</div>
                  <div className="mt-0.5 flex gap-1">
                    {form.types.map((type) => (
                      <TypeBadge key={type.slug} type={type} />
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Dans les Pokédex</h2>
        {species.pokedexes.length === 0 ? (
          <p className="text-sm text-muted">Présent uniquement dans le Pokédex national.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-card text-left text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Pokédex</th>
                  <th className="px-3 py-2 font-medium">N°</th>
                  <th className="px-3 py-2 font-medium">Jeux</th>
                </tr>
              </thead>
              <tbody>
                {species.pokedexes.map((pokedex) => (
                  <tr key={pokedex.id} className="border-t border-border">
                    <td className="px-3 py-2">{pokedex.nameFr}</td>
                    <td className="px-3 py-2 tabular-nums">{String(pokedex.number).padStart(3, "0")}</td>
                    <td className="px-3 py-2">
                      {pokedex.versions.map((version, index) => (
                        <span key={version.id}>
                          {index > 0 && ", "}
                          <Link href={`/jeux/${version.slug}`} className="underline decoration-border hover:text-accent">
                            {version.nameFr}
                          </Link>
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Où le trouver</h2>
        {encounters.length === 0 ? (
          <p className="text-sm text-muted">
            Aucune rencontre sauvage connue (Pokémon obtenu par évolution, échange ou événement, ou données absentes de PokeAPI).
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {encounters.map((entry) => (
              <div key={entry.version.id} className="rounded-lg border border-border bg-card p-3">
                <h3 className="mb-2 font-medium">
                  <Link href={`/jeux/${entry.version.slug}`} className="hover:text-accent">
                    {entry.version.nameFr}
                  </Link>
                </h3>
                <ul className="space-y-1 text-sm">
                  {entry.locations.map((location) => (
                    <li key={location.id} className="flex flex-wrap items-baseline gap-x-2">
                      <Link
                        href={`/rencontres/${entry.version.slug}/${location.slug}`}
                        className="underline decoration-border hover:text-accent"
                      >
                        {location.nameFr}
                      </Link>
                      <span className="text-muted">
                        {location.methods.join(", ")} · {formatLevel(location.minLevel, location.maxLevel)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
