import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon, ArrowRightIcon, StarIcon } from "@/components/icons";
import { SectionHeader } from "@/components/page-header";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { SpeciesCaptureChips } from "@/components/species-capture-chips";
import { StatusBadge } from "@/components/status-badge";
import { TypeBadge } from "@/components/type-badge";
import { card, dexNumber, ghostButton, secondaryButton, smallButton, spriteBox, textLink } from "@/components/ui";
import { getSpeciesCaptures } from "@/lib/data/captures";
import { isDlcVersion } from "@/lib/data/filters";
import { getPokedexHrefs } from "@/lib/data/pokedex-pages";
import { getShinies, getSpeciesHunts } from "@/lib/data/shiny";
import { getSpeciesById, getSpeciesEncounters } from "@/lib/data/species";
import { getCurrentUser } from "@/lib/session";

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: PageProps<"/pokemon/[id]">): Promise<Metadata> {
  const { id } = await params;
  const speciesId = parseId(id);
  const species = speciesId ? await getSpeciesById(speciesId) : null;
  return { title: species ? `${species.nameFr} · N° ${dexNumber(species.id, 4)}` : "Pokémon introuvable" };
}

function formatLevel(min: number, max: number) {
  return min === max ? `Niv. ${min}` : `Niv. ${min}-${max}`;
}

async function MyCaptures({ speciesId, versions }: { speciesId: number; versions: { id: number; slug: string; nameFr: string }[] }) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <p className="t-small text-ink-2">
        <Link href={`/connexion?next=${encodeURIComponent(`/pokemon/${speciesId}`)}`} className={textLink}>
          Connecte-toi
        </Link>{" "}
        pour noter dans quels jeux tu l&apos;as attrapé.
      </p>
    );
  }
  // Un jeu peut apparaître via plusieurs Pokédex (Épée : Galar + Isolarmure + Couronneige) : on dédoublonne,
  // et les extensions sont suivies avec leur jeu de base.
  const unique = [...new Map(versions.filter((v) => !isDlcVersion(v.slug)).map((v) => [v.id, v])).values()];
  if (unique.length === 0) return <p className="t-small text-ink-2">Ce Pokémon n&apos;est dans aucun Pokédex régional.</p>;
  const captures = await getSpeciesCaptures(user.id, speciesId);
  return <SpeciesCaptureChips speciesId={speciesId} versions={unique} captured={captures.map((c) => c.id)} />;
}

const numberFr = new Intl.NumberFormat("fr-FR");
const dateFr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

/** Chasses en cours et shinies obtenus pour cette espèce, avec les raccourcis vers les formulaires. */
async function MyShinies({ speciesId }: { speciesId: number }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const [hunts, shinies] = await Promise.all([getSpeciesHunts(user.id, speciesId), getShinies(user.id, speciesId)]);
  return (
    <section className="space-y-4">
      <SectionHeader title="Shiny" />
      {(hunts.length > 0 || shinies.length > 0) && (
        <ul className={`${card} divide-y divide-line`}>
          {hunts.map((hunt) => (
            <li key={hunt.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 t-small">
              <span>
                Chasse en cours dans {hunt.version.nameFr} : <b className="font-bold text-ink">{numberFr.format(hunt.count)}</b> rencontres
                {hunt.method && <span className="text-ink-2"> · {hunt.method}</span>}
              </span>
              <Link href={`/shiny/chasse/${hunt.id}`} className={`${secondaryButton} ${smallButton} ml-auto`}>
                Ouvrir le compteur
              </Link>
            </li>
          ))}
          {shinies.map((shiny) => (
            <li key={shiny.id} className="flex flex-wrap items-center gap-3 px-4 py-3 t-small">
              <StatusBadge tone="shiny">
                <StarIcon size={12} /> Shiny
              </StatusBadge>
              <span>
                Attrapé dans {shiny.version.nameFr} le {dateFr.format(shiny.caughtAt)}
                {shiny.encounters !== null && ` après ${numberFr.format(shiny.encounters)} rencontres`}
                {shiny.nickname && <span className="text-ink-2"> — « {shiny.nickname} »</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <Link href={`/shiny/nouvelle?espece=${speciesId}`} className={`${secondaryButton} ${smallButton}`}>
          Lancer une chasse shiny
        </Link>
        <Link href={`/shiny/ajouter?espece=${speciesId}`} className={`${ghostButton} ${smallButton}`}>
          Ajouter un shiny
        </Link>
      </div>
    </section>
  );
}

export default async function SpeciesPage({ params }: PageProps<"/pokemon/[id]">) {
  const { id } = await params;
  const speciesId = parseId(id);
  if (!speciesId) notFound();

  const [species, encounters, pokedexHrefs] = await Promise.all([getSpeciesById(speciesId), getSpeciesEncounters(speciesId), getPokedexHrefs()]);
  if (!species) notFound();

  const flags = [species.isLegendary && "Légendaire", species.isMythical && "Fabuleux", species.isBaby && "Bébé"].filter(
    (flag): flag is string => Boolean(flag),
  );

  const facts = [
    species.defaultPokemon.height !== null && { label: "Taille", value: `${(species.defaultPokemon.height / 10).toLocaleString("fr-FR")} m` },
    species.defaultPokemon.weight !== null && { label: "Poids", value: `${(species.defaultPokemon.weight / 10).toLocaleString("fr-FR")} kg` },
    species.captureRate !== null && { label: "Taux de capture", value: String(species.captureRate) },
  ].filter((f): f is { label: string; value: string } => Boolean(f));

  return (
    <div className="space-y-10">
      <nav className="flex justify-between gap-3" aria-label="Pokémon voisins">
        {species.id > 1 ? (
          <Link href={`/pokemon/${species.id - 1}`} className={`${ghostButton} ${smallButton} -ml-3`}>
            <ArrowLeftIcon /> {dexNumber(species.id - 1, 4)}
          </Link>
        ) : (
          <span />
        )}
        <Link href={`/pokemon/${species.id + 1}`} className={`${ghostButton} ${smallButton} -mr-3`}>
          {dexNumber(species.id + 1, 4)} <ArrowRightIcon />
        </Link>
      </nav>

      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="flex gap-3">
          <span className={`${spriteBox} size-28 rounded-lg sm:size-32`}>
            <PokemonSprite pokemonId={species.defaultPokemon.id} alt={species.nameFr} size={96} />
          </span>
          <span className={`${spriteBox} relative size-28 rounded-lg sm:size-32`}>
            <PokemonSprite pokemonId={species.defaultPokemon.id} alt={`${species.nameFr} chromatique`} size={96} shiny />
            <StarIcon size={14} className="absolute top-2.5 right-2.5 text-shiny" />
          </span>
        </div>
        <div className="min-w-0 space-y-3">
          <p className="t-caption">
            N° {dexNumber(species.id, 4)} · {species.generation.nameFr}
          </p>
          <h1 className="t-display">{species.nameFr}</h1>
          <p className="text-ink-2">
            {species.nameEn}
            {species.genusFr && ` · ${species.genusFr}`}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {species.defaultPokemon.types.map((type) => (
              <TypeBadge key={type.slug} type={type} size="md" />
            ))}
            {flags.map((flag) => (
              <StatusBadge key={flag}>{flag}</StatusBadge>
            ))}
          </div>
          {facts.length > 0 && (
            <dl className="flex flex-wrap gap-x-8 gap-y-2 pt-1">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="t-caption">{fact.label}</dt>
                  <dd className="font-semibold">{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </header>

      {species.forms.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Formes" />
          <ul className="flex flex-wrap gap-3">
            {species.forms.map((form) => (
              <li key={form.id} className={`${card} flex items-center gap-3 p-2 pr-4`}>
                <span className={`${spriteBox} size-12 rounded-sm`}>
                  <PokemonSprite pokemonId={form.id} fallbackId={species.defaultPokemon.id} alt={form.formNameFr ?? form.slug} size={48} />
                </span>
                <div className="space-y-1">
                  <div className="t-small font-semibold">{form.formNameFr ?? form.slug}</div>
                  <div className="flex gap-1">
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

      <section className="space-y-4">
        <SectionHeader title="Mes captures" />
        {/* Dépend de la session : streamé, le reste de la fiche reste en cache. */}
        <Suspense fallback={<div aria-busy className="h-8 w-64 animate-pulse rounded-full bg-surface-2" />}>
          <MyCaptures speciesId={species.id} versions={species.pokedexes.flatMap((p) => p.versions)} />
        </Suspense>
      </section>

      {/* Chasses shiny et shinies de l'espèce : rien à afficher sans compte. */}
      <Suspense fallback={null}>
        <MyShinies speciesId={species.id} />
      </Suspense>

      <section className="space-y-4">
        <SectionHeader title="Dans les Pokédex" />
        {species.pokedexes.length === 0 ? (
          <p className="t-small text-ink-2">Présent uniquement dans le Pokédex national.</p>
        ) : (
          <div className={`${card} overflow-x-auto`}>
            <table className="w-full text-sm">
              <thead className="text-left text-xs font-semibold tracking-[0.06em] text-ink-3 uppercase">
                <tr>
                  <th className="px-4 py-2.5">Pokédex</th>
                  <th className="px-4 py-2.5">N°</th>
                  <th className="px-4 py-2.5">Jeux</th>
                </tr>
              </thead>
              <tbody>
                {species.pokedexes.map((pokedex) => (
                  <tr key={pokedex.id} className="border-t border-line">
                    <td className="px-4 py-2.5 font-medium">{pokedex.nameFr}</td>
                    <td className="px-4 py-2.5 text-ink-2">{dexNumber(pokedex.number)}</td>
                    <td className="px-4 py-2.5">
                      {pokedex.versions.map((version, index) => (
                        <span key={version.id}>
                          {index > 0 && ", "}
                          <Link href={pokedexHrefs[version.slug] ?? "/pokedex"} className={textLink}>
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

      <section className="space-y-4">
        <SectionHeader title="Où le trouver" />
        {encounters.length === 0 ? (
          <p className="t-small text-ink-2">
            Aucune rencontre sauvage connue (Pokémon obtenu par évolution, échange ou événement, ou données absentes de PokeAPI).
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {encounters.map((entry) => (
              <div key={entry.version.id} className={`${card} space-y-2 p-4`}>
                <h3 className="font-semibold">
                  <Link href={pokedexHrefs[entry.version.slug] ?? "/pokedex"} className="hover:underline">
                    {entry.version.nameFr}
                  </Link>
                </h3>
                <ul className="space-y-1 t-small">
                  {entry.locations.map((location) => (
                    <li key={location.id} className="flex flex-wrap items-baseline gap-x-2">
                      <Link href={`/rencontres/${entry.version.slug}/${location.slug}`} className={textLink}>
                        {location.nameFr}
                      </Link>
                      <span className="text-ink-2">
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
