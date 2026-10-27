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
import { CurrentGame } from "@/components/current-game";
import { GameTimeline } from "@/components/game-timeline";
import { ChevronRightIcon } from "@/components/icons";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { cardLink } from "@/components/ui";
import { NATIONAL_PREVIEW } from "@/lib/data/game-catalog";
import { getHomeTimeline } from "@/lib/data/games";
import { NATIONAL_SLUG } from "@/lib/game";

export default async function HomePage() {
  const generations = await getHomeTimeline();

  return (
    <div className="space-y-10 sm:space-y-14">
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <CurrentGame generations={generations} />
        <NationalCard />
      </section>

      <GameTimeline generations={generations} />

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

/** Le « jeu » National : une ligne compacte sur mobile, une carte à côté de la partie en cours dès `lg`. */
function NationalCard() {
  return (
    <Link
      href={`/jeu/${NATIONAL_SLUG}`}
      className={`${cardLink} flex items-center gap-3.5 p-3 pr-4 lg:flex-col lg:items-stretch lg:justify-between lg:gap-5 lg:p-6`}
    >
      <span className="flex pl-2.5 lg:order-2 lg:pl-3">
        {NATIONAL_PREVIEW.map((id, index) => (
          <span
            key={id}
            className={`-ml-2.5 size-10 shrink-0 place-items-center rounded-full border-2 border-surface bg-surface-2 lg:-ml-3 lg:size-14 ${index > 2 ? "hidden lg:grid" : "grid"}`}
          >
            <PokemonSprite pokemonId={id} alt="" size={44} className="size-8 object-contain lg:size-11" />
          </span>
        ))}
      </span>
      <span className="min-w-0 flex-1 lg:order-1 lg:flex-none lg:space-y-1.5">
        <span className="hidden t-caption lg:block">Tous les jeux</span>
        <span className="block font-bold lg:text-2xl lg:leading-[30px] lg:tracking-[-0.015em]">Pokédex National</span>
        <span className="block t-small text-ink-2">
          <span className="lg:hidden">Toutes générations</span>
          <span className="hidden lg:inline">Toutes les espèces, toutes générations confondues.</span>
        </span>
      </span>
      <ChevronRightIcon className="shrink-0 text-ink-3 lg:hidden" />
    </Link>
  );
}
