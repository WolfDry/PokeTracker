"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentType, Suspense } from "react";
import { BallIcon, OverviewIcon, StarIcon, TeamIcon } from "@/components/icons";

type Tab = { href: string; label: string; icon: ComponentType<{ size?: number }>; exact?: boolean };

/** Onglets d'un jeu ; pas d'équipe pour le National, qui n'est pas un jeu jouable. */
function gameTabs(slug: string, national: boolean): Tab[] {
  const base = `/jeu/${slug}`;
  return [
    { href: base, label: "Résumé", icon: OverviewIcon, exact: true },
    { href: `${base}/captures`, label: "Living dex", icon: BallIcon },
    { href: `${base}/shiny`, label: "Shiny dex", icon: StarIcon },
    ...(national ? [] : [{ href: `${base}/equipe`, label: "Équipe", icon: TeamIcon }]),
  ];
}

const isActive = (pathname: string | null, tab: Tab) =>
  pathname === tab.href || (!tab.exact && Boolean(pathname?.startsWith(`${tab.href}/`)));

function Tabs({ tabs, pathname }: { tabs: Tab[]; pathname: string | null }) {
  return (
    <>
      {/* Dès la tablette : rangée d'onglets sous l'en-tête du jeu, l'onglet actif souligné à la teinte du jeu. */}
      <nav aria-label="Sections du jeu" className="hidden border-b border-line md:block">
        <ul className="-mb-px flex gap-6">
          {tabs.map((tab) => {
            const active = isActive(pathname, tab);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-11 items-center gap-2 border-b-2 text-sm font-semibold transition-colors ${
                    active ? "border-game text-ink" : "border-transparent text-ink-2 hover:text-ink"
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Sur mobile : barre fixée en bas (le <main> lui réserve la place). */}
      <nav
        aria-label="Sections du jeu"
        className={`fixed inset-x-0 bottom-0 z-20 grid border-t border-line bg-surface px-2 pt-2 pb-[max(env(safe-area-inset-bottom),12px)] md:hidden ${
          tabs.length === 4 ? "grid-cols-4" : "grid-cols-3"
        }`}
      >
        {tabs.map((tab) => {
          const active = isActive(pathname, tab);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-sm text-[11px] font-semibold transition-colors ${
                active ? "text-game-text" : "text-ink-3 hover:text-ink-2"
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function CurrentTabs({ tabs }: { tabs: Tab[] }) {
  return <Tabs tabs={tabs} pathname={usePathname()} />;
}

/** Navigation entre le résumé et les fonctionnalités d'un jeu. À rendre dans un `.game-tint`. */
export function GameTabs({ slug, national }: { slug: string; national: boolean }) {
  const tabs = gameTabs(slug, national);
  return (
    <Suspense fallback={<Tabs tabs={tabs} pathname={null} />}>
      <CurrentTabs tabs={tabs} />
    </Suspense>
  );
}
