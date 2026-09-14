"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { BallIcon, MapIcon, PokedexIcon, StarIcon } from "@/components/icons";

export const navLinks: { href: string; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { href: "/pokedex", label: "Pokédex", icon: PokedexIcon },
  { href: "/rencontres", label: "Rencontres", icon: MapIcon },
  { href: "/captures", label: "Captures", icon: BallIcon },
  { href: "/shiny", label: "Shiny", icon: StarIcon },
];

/** `/pokedex/kanto` → section Pokédex active. */
export const isActive = (pathname: string | null, href: string) => pathname === href || Boolean(pathname?.startsWith(`${href}/`));

function Links({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex items-center gap-1" aria-label="Sections">
      {navLinks.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-sm px-2.5 py-1.5 text-sm font-medium transition-colors ${
              active ? "bg-surface-2 text-ink" : "text-ink-2 hover:text-ink"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Navigation desktop de l'en-tête, la section courante en évidence.
 * `usePathname` suspend au pré-rendu des routes à paramètre inconnu : à rendre sous
 * <Suspense fallback={<NavLinksFallback />}> pour garder l'en-tête dans la coquille statique.
 */
export function NavLinks() {
  return <Links pathname={usePathname()} />;
}

/** Mêmes liens, sans section active, le temps que le chemin soit connu. */
export function NavLinksFallback() {
  return <Links pathname={null} />;
}
