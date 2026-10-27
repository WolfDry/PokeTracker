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
import { cardLink, dexNumber } from "@/components/ui";
import { NATIONAL_PREVIEW } from "@/lib/data/game-catalog";
import { getHomeTimeline, getNationalSpeciesCount } from "@/lib/data/games";
import { NATIONAL_SLUG } from "@/lib/game";

export default async function HomePage() {
  const [generations, nationalCount] = await Promise.all([getHomeTimeline(), getNationalSpeciesCount()]);

  return (
    <div className="space-y-10 sm:space-y-14">
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <CurrentGame generations={generations} />
        <NationalCard count={nationalCount} />
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
function NationalCard({ count }: { count: number }) {
  const range = `N° 0001 → ${dexNumber(count, 4)}`;
  return (
    <Link
      href={`/jeu/${NATIONAL_SLUG}`}
      className={`${cardLink} flex items-center gap-3.5 rounded-[18px] p-3 pr-4 lg:flex-col lg:items-stretch lg:justify-between lg:gap-5 lg:rounded-3xl lg:p-6`}
    >
      <span className="flex pl-2.5 lg:order-2 lg:pl-3">
        {NATIONAL_PREVIEW.map((id, index) => (
          <span
            key={id}
            className={`-ml-2.5 size-[42px] shrink-0 place-items-center rounded-full border-2 border-surface bg-surface-2 lg:-ml-3 lg:size-16 lg:border-[3px] ${index > 2 ? "hidden lg:grid" : "grid"}`}
          >
            <PokemonSprite pokemonId={id} alt="" size={56} className="size-9 object-contain lg:size-14" />
          </span>
        ))}
      </span>
      <span className="min-w-0 flex-1 lg:order-1 lg:flex-none lg:space-y-1.5">
        <span className="hidden t-caption font-bold lg:block">Toutes les générations</span>
        <span className="block font-display text-[17px] leading-[22px] font-bold lg:text-[28px] lg:leading-[34px] lg:tracking-[-0.015em]">
          Pokédex National
        </span>
        <span className="block t-lcd leading-4 text-ink-2 lg:hidden">{range}</span>
      </span>
      <ChevronRightIcon className="shrink-0 text-ink-3 lg:hidden" />
      <span className="hidden items-center justify-between gap-3 lg:order-3 lg:flex">
        <span className="rounded-lg bg-surface-2 px-2.5 py-1.5 t-lcd text-xs leading-4 text-ink-2">{range}</span>
        <span className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line-strong pr-4 pl-[18px] font-semibold">
          Ouvrir
          <ChevronRightIcon size={16} />
        </span>
      </span>
    </Link>
  );
}
