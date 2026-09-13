import Link from "next/link";

const links = [
  { href: "/jeux", label: "Pokédex" },
  { href: "/rencontres", label: "Rencontres" },
  { href: "/recherche", label: "Recherche" },
  { href: "/captures", label: "Mes captures" },
  { href: "/shiny", label: "Shiny" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span
            aria-hidden
            className="inline-block size-4 rounded-full border-2 border-foreground bg-[linear-gradient(to_bottom,var(--accent)_50%,transparent_50%)]"
          />
          PokeTracker
        </Link>
        <nav className="flex flex-1 items-center gap-4 overflow-x-auto text-sm whitespace-nowrap">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/connexion"
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-background"
        >
          Connexion
        </Link>
      </div>
    </header>
  );
}
