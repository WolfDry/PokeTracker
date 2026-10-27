// Navigation désactivée temporairement : seule la page d'accueil est accessible.
// import Link from "next/link";
// import type { ComponentType } from "react";
// import { ArrowRightIcon, BallIcon, MapIcon, PokedexIcon, StarIcon, TeamIcon } from "@/components/icons";
// import { cardLink } from "@/components/ui";
//
// const features: { href: string; title: string; text: string; icon: ComponentType<{ size?: number }> }[] = [
//   {
//     href: "/pokedex",
//     title: "Pokédex par région",
//     text: "Tous les Pokédex, de Rouge/Bleu à Écarlate/Violet, avec les Pokémon disponibles dans chaque jeu.",
//     icon: PokedexIcon,
//   },
//   {
//     href: "/rencontres",
//     title: "Où trouver un Pokémon",
//     text: "Choisis un jeu et un lieu : zone, méthode, niveaux et taux de rencontre.",
//     icon: MapIcon,
//   },
//   {
//     href: "/captures",
//     title: "Suivi des captures",
//     text: "Coche tes captures jeu par jeu et suis ta progression vers le Pokédex complet.",
//     icon: BallIcon,
//   },
//   {
//     href: "/shiny",
//     title: "Chasse aux shiny",
//     text: "Compteur de rencontres par chasse et collection de tes shiny attrapés.",
//     icon: StarIcon,
//   },
//   {
//     href: "/equipe",
//     title: "Composer une équipe",
//     text: "Six Pokémon disponibles dans ton jeu, et leurs faiblesses et avantages de types d'un coup d'œil.",
//     icon: TeamIcon,
//   },
// ];

import Link from "next/link";
import { ArrowRightIcon, PokedexIcon } from "@/components/icons";
import { cardLink } from "@/components/ui";
import { isDlcVersion } from "@/lib/data/filters";
import { getGenerationsWithGames } from "@/lib/data/games";
import { NATIONAL_SLUG } from "@/lib/game";

export default async function HomePage() {
  // Les extensions (Isolarmure, Disque Indigo…) se rattachent à leur jeu de base : pas de carte à part.
  const generations = (await getGenerationsWithGames())
    .map((generation) => ({ ...generation, versions: generation.versions.filter((v) => !isDlcVersion(v.slug)) }))
    .filter((generation) => generation.versions.length > 0);

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <p className="t-caption">Compagnon d&apos;aventure</p>
        <h1 className="t-display max-w-2xl">Où en est ta collection&nbsp;?</h1>
        <p className="max-w-xl text-ink-2">
          Pokédex, lieux de rencontre, captures et chasses shiny, pour tous les jeux de la série principale.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="t-h2">Choisis ton jeu</h2>
        <Link href={`/jeu/${NATIONAL_SLUG}`} className={`${cardLink} group flex gap-4 p-5`}>
          <span className="grid size-11 shrink-0 place-items-center rounded-md bg-surface-2 text-ink-2">
            <PokedexIcon size={20} />
          </span>
          <span className="min-w-0 flex-1 space-y-1">
            <span className="flex items-center gap-2 font-semibold">
              National
              <ArrowRightIcon className="text-ink-3 transition-transform group-hover:translate-x-0.5" />
            </span>
            <span className="block t-small text-ink-2">Tous les Pokémon, toutes générations confondues.</span>
          </span>
        </Link>
      </section>

      {generations.map((generation) => (
        <section key={generation.id} className="space-y-4">
          <div className="flex items-baseline gap-3">
            <h2 className="t-h2">{generation.nameFr}</h2>
            {generation.regionNames.length > 0 && <p className="t-small text-ink-2">{generation.regionNames.join(", ")}</p>}
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {generation.versions.map((version) => (
              <li key={version.id}>
                <Link href={`/jeu/${version.slug}`} className={`${cardLink} group flex items-center justify-between gap-3 px-4 py-3.5`}>
                  <span className="font-semibold">{version.nameFr}</span>
                  <ArrowRightIcon className="text-ink-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* <section className="grid gap-3 sm:grid-cols-2">
        {features.map(({ href, title, text, icon: Icon }) => (
          <Link key={href} href={href} className={`${cardLink} group flex gap-4 p-5`}>
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-surface-2 text-ink-2">
              <Icon size={20} />
            </span>
            <span className="min-w-0 flex-1 space-y-1">
              <span className="flex items-center gap-2 font-semibold">
                {title}
                <ArrowRightIcon className="text-ink-3 transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="block t-small text-ink-2">{text}</span>
            </span>
          </Link>
        ))}
      </section> */}
    </div>
  );
}
