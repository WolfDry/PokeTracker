import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon, ArrowRightIcon, StarIcon } from "@/components/icons";
import { SectionHeader } from "@/components/page-header";
import { SpeciesCaptureChips } from "@/components/species-capture-chips";
import { SpeciesFamily } from "@/components/species-family";
import { StatusBadge } from "@/components/status-badge";
import { card, dexNumber, ghostButton, secondaryButton, smallButton, textLink } from "@/components/ui";
import { getSpeciesCaptures } from "@/lib/data/captures";
import { isDlcVersion } from "@/lib/data/filters";
import { getPokedexHrefs } from "@/lib/data/pokedex-pages";
import { getShinies, getSpeciesHunts } from "@/lib/data/shiny";
import { getEvolutionFamily, getSpeciesById, getSpeciesEncounters } from "@/lib/data/species";
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

  const [species, family, encounters, pokedexHrefs] = await Promise.all([
    getSpeciesById(speciesId),
    getEvolutionFamily(speciesId),
    getSpeciesEncounters(speciesId),
    getPokedexHrefs(),
  ]);
  if (!species || !family) notFound();

  // Jeux où l'espèce se rencontre sans figurer dans leur Pokédex régional (Celebi dans Rubis via le disque bonus
  // de Colosseum…) : elle y est au Pokédex national. On les liste sous cette entrée pour rester cohérent avec
  // « Où le trouver », et on les rend cochables dans « Mes captures ».
  const dexVersionIds = new Set(species.pokedexes.flatMap((p) => p.versions.map((v) => v.id)));
  const nationalOnlyVersions = encounters.map((e) => e.version).filter((v) => !dexVersionIds.has(v.id) && !isDlcVersion(v.slug));
  const pokedexRows = [
    ...species.pokedexes,
    ...(nationalOnlyVersions.length > 0 ? [{ id: 0, slug: "national", nameFr: "National", number: species.id, versions: nationalOnlyVersions }] : []),
  ];

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

      {/* En-tête et arbre d'évolution : le stade ou la forme cliqué remplit l'en-tête. */}
      <SpeciesFamily root={family} speciesId={species.id} />

      <section className="space-y-4">
        <SectionHeader title="Mes captures" />
        {/* Dépend de la session : streamé, le reste de la fiche reste en cache. */}
        <Suspense fallback={<div aria-busy className="h-8 w-64 animate-pulse rounded-full bg-surface-2" />}>
          <MyCaptures speciesId={species.id} versions={pokedexRows.flatMap((p) => p.versions)} />
        </Suspense>
      </section>

      {/* Chasses shiny et shinies de l'espèce : rien à afficher sans compte. */}
      <Suspense fallback={null}>
        <MyShinies speciesId={species.id} />
      </Suspense>

      <section className="space-y-4">
        <SectionHeader title="Dans les Pokédex" />
        {pokedexRows.length === 0 ? (
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
                {pokedexRows.map((pokedex) => (
                  <tr key={pokedex.id} className="border-t border-line">
                    <td className="px-4 py-2.5 font-medium">{pokedex.nameFr}</td>
                    <td className="px-4 py-2.5 text-ink-2">{dexNumber(pokedex.number, pokedex.slug === "national" ? 4 : 3)}</td>
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
