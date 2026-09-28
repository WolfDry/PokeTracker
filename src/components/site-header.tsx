import Link from "next/link";
import { Suspense } from "react";
import { PokeballIcon, SearchIcon } from "@/components/icons";
import { NavLinks, NavLinksFallback } from "@/components/nav-links";
import { SearchForm } from "@/components/search-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { ghostButton } from "@/components/ui";
import { UserMenu, UserMenuFallback } from "@/components/user-menu";

const iconButton = `${ghostButton} size-10 shrink-0 px-0`;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 sm:px-10 lg:gap-6">
        <Link
          href="/"
          aria-label="PokeTracker"
          className="flex shrink-0 items-center gap-2.5 text-[17px] font-extrabold tracking-[-0.02em]"
        >
          <PokeballIcon fill="#fff" viewBox="0 0 512 512" />
          {/* Le nom s'efface sur tablette pour laisser la place à la navigation. */}
          <span className="md:max-lg:hidden">PokeTracker</span>
        </Link>
        {/* Navigation dans l'en-tête dès la tablette ; barre d'onglets en bas en dessous. */}
        <div className="hidden md:block">
          <Suspense fallback={<NavLinksFallback />}>
            <NavLinks />
          </Suspense>
        </div>
        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
          {/* Champ complet seulement quand la navigation laisse la place ; il rétrécit si besoin. */}
          <div className="hidden min-w-0 xl:block">
            <SearchForm />
          </div>
          <Link href="/recherche" aria-label="Rechercher" title="Rechercher" className={`${iconButton} xl:hidden`}>
            <SearchIcon />
          </Link>
          <ThemeToggle className={iconButton} />
          {/* La session se lit à la requête : le reste de l'en-tête reste dans la coquille statique. */}
          <Suspense fallback={<UserMenuFallback />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
