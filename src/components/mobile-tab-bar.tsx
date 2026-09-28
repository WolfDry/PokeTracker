"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { isActive, navLinks } from "@/components/nav-links";

function Tabs({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface px-2 pt-2 pb-[max(env(safe-area-inset-bottom),12px)] md:hidden"
    >
      {navLinks.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-sm text-[11px] font-semibold transition-colors ${
              active ? "text-ink" : "text-ink-3 hover:text-ink-2"
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function CurrentTabs() {
  return <Tabs pathname={usePathname()} />;
}

/** Barre d'onglets fixée en bas sur mobile ; remplacée par la navigation de l'en-tête dès `md`. */
export function MobileTabBar() {
  return (
    <Suspense fallback={<Tabs pathname={null} />}>
      <CurrentTabs />
    </Suspense>
  );
}
