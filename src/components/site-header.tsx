import Link from "next/link";
import { Suspense } from "react";
import { NavLinks, NavLinksFallback } from "@/components/nav-links";
import { SearchForm } from "@/components/search-form";
import { UserMenu, UserMenuFallback } from "@/components/user-menu";

const desktopNav = "hidden items-center gap-4 text-sm whitespace-nowrap sm:flex";
const mobileNav = "-mx-4 mt-2 flex gap-4 overflow-x-auto px-4 text-sm whitespace-nowrap sm:hidden";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
            <span
              aria-hidden
              className="inline-block size-4 rounded-full border-2 border-foreground bg-[linear-gradient(to_bottom,var(--accent)_50%,transparent_50%)]"
            />
            PokeTracker
          </Link>
          <Suspense fallback={<NavLinksFallback className={desktopNav} />}>
            <NavLinks className={desktopNav} />
          </Suspense>
          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Champ de recherche sur grand écran, simple bouton vers /recherche sur mobile. */}
            <div className="hidden md:block">
              <SearchForm />
            </div>
            <Link
              href="/recherche"
              aria-label="Rechercher"
              title="Rechercher"
              className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-muted hover:text-foreground md:hidden"
            >
              <svg aria-hidden viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="8.5" cy="8.5" r="5.5" />
                <path d="m13 13 4 4" />
              </svg>
            </Link>
            {/* La session se lit à la requête : le reste de l'en-tête reste dans la coquille statique. */}
            <Suspense fallback={<UserMenuFallback />}>
              <UserMenu />
            </Suspense>
          </div>
        </div>
        {/* Sur mobile, la navigation passe sur une seconde ligne, défilable. */}
        <Suspense fallback={<NavLinksFallback className={mobileNav} />}>
          <NavLinks className={mobileNav} />
        </Suspense>
      </div>
    </header>
  );
}
