"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/jeux", label: "Pokédex" },
  { href: "/rencontres", label: "Rencontres" },
  { href: "/captures", label: "Mes captures" },
  { href: "/shiny", label: "Shiny" },
];

function Links({ className, pathname }: { className?: string; pathname: string | null }) {
  return (
    <nav className={className}>
      {links.map((link) => {
        const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`transition-colors hover:text-foreground ${active ? "font-medium text-foreground" : "text-muted"}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Liens de navigation, la section courante en évidence (`/jeux/red` → Pokédex).
 * `usePathname` suspend au pré-rendu des routes à paramètre inconnu : à rendre sous
 * <Suspense fallback={<NavLinksFallback />}> pour garder l'en-tête dans la coquille statique.
 */
export function NavLinks({ className }: { className?: string }) {
  return <Links className={className} pathname={usePathname()} />;
}

/** Mêmes liens, sans section active, le temps que le chemin soit connu. */
export function NavLinksFallback({ className }: { className?: string }) {
  return <Links className={className} pathname={null} />;
}
