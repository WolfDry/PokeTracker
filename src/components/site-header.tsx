import Link from "next/link";
// Navigation désactivée temporairement : seule la page d'accueil est accessible.
// import { Suspense } from "react";
// import { SearchIcon } from "@/components/icons";
// import { NavLinks, NavLinksFallback } from "@/components/nav-links";
// import { SearchForm } from "@/components/search-form";
import { ThemeToggle } from "@/components/theme-toggle";
// import { UserMenu, UserMenuFallback } from "@/components/user-menu";

/** Bouton rond sur la coque. */
const iconButton = "grid size-11 shrink-0 place-items-center rounded-full bg-on-shell/15 text-on-shell transition-colors hover:bg-on-shell/25";

/**
 * En-tête : la coque rouge du Pokédex, avec son grand voyant et ses trois petits voyants. Dessous, le décroché
 * de la coque (non collant) prolonge le rouge sous le logo, du bord gauche de la fenêtre jusqu'après le nom.
 */
export function SiteHeader() {
  return (
    <>
      <header className="sticky top-0 z-20 bg-shell text-on-shell">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-10 lg:gap-6">
          <Link href="/" aria-label="PokeTracker" className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
            <PokedexLeds />
            {/* Le nom s'efface sur tablette pour laisser la place à la navigation. */}
            <span className="font-display text-[19px] leading-6 font-bold tracking-[-0.01em] sm:text-[23px] sm:leading-7 md:max-lg:hidden">
              PokeTracker
            </span>
          </Link>
          {/* Navigation dans l'en-tête dès la tablette ; barre d'onglets en bas en dessous. */}
          {/* <div className="hidden md:block">
            <Suspense fallback={<NavLinksFallback />}>
              <NavLinks />
            </Suspense>
          </div> */}
          <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
            {/* Champ complet seulement quand la navigation laisse la place ; il rétrécit si besoin. */}
            {/* <div className="hidden min-w-0 xl:block">
              <SearchForm />
            </div>
            <Link href="/recherche" aria-label="Rechercher" title="Rechercher" className={`${iconButton} xl:hidden`}>
              <SearchIcon />
            </Link> */}
            <ThemeToggle className={iconButton} />
            {/* La session se lit à la requête : le reste de l'en-tête reste dans la coquille statique. */}
            {/* <Suspense fallback={<UserMenuFallback />}>
              <UserMenu />
            </Suspense> */}
          </div>
        </div>
      </header>
      <div
        aria-hidden
        className="h-3.5 w-[220px] bg-shell [clip-path:polygon(0_0,100%_0,calc(100%_-_16px)_100%,0_100%)] sm:h-[18px] sm:w-[max(400px,calc(50%_-_36rem_+_400px))] sm:[clip-path:polygon(0_0,100%_0,calc(100%_-_22px)_100%,0_100%)]"
      />
    </>
  );
}

const SMALL_LEDS = ["bg-led-red", "bg-led-yellow", "bg-led-green"];

/** Le grand voyant bleu (reflet compris) et les trois petits voyants rouge, jaune, vert. */
function PokedexLeds() {
  return (
    <span aria-hidden className="flex items-start gap-2.5 sm:gap-3.5">
      <span className="relative block size-8 rounded-full border-[3px] border-led-ring bg-led shadow-[0_0_0_2px_var(--shell-deep)] sm:size-[38px]">
        <span className="absolute top-[4px] left-[5px] size-[7px] rounded-full bg-led-ring/75 sm:top-[5px] sm:left-1.5 sm:size-[9px]" />
      </span>
      <span className="mt-3.5 flex gap-1 sm:mt-4 sm:gap-[5px]">
        {SMALL_LEDS.map((color) => (
          <span key={color} className={`block size-[7px] rounded-full border-[1.5px] border-shell-deep sm:size-[9px] ${color}`} />
        ))}
      </span>
    </span>
  );
}
