import Link from "next/link";
import { Suspense } from "react";
import { SearchForm } from "@/components/search-form";
import { UserMenu, UserMenuFallback } from "@/components/user-menu";

const links = [
  { href: "/jeux", label: "Pokédex" },
  { href: "/rencontres", label: "Rencontres" },
  { href: "/captures", label: "Mes captures" },
  { href: "/shiny", label: "Shiny" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span
            aria-hidden
            className="inline-block size-4 rounded-full border-2 border-foreground bg-[linear-gradient(to_bottom,var(--accent)_50%,transparent_50%)]"
          />
          PokeTracker
        </Link>
        <nav className="flex items-center gap-4 overflow-x-auto text-sm whitespace-nowrap">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <SearchForm />
          {/* La session se lit à la requête : le reste de l'en-tête reste dans la coquille statique. */}
          <Suspense fallback={<UserMenuFallback />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
