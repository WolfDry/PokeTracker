import Link from "next/link";
import { Fragment } from "react";
import { ChevronRightIcon } from "@/components/icons";

type Crumb = { href?: string; label: string };

/** Fil d'Ariane : « Pokédex › Pokémon Rouge », le dernier élément est la page courante. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 t-small text-ink-2">
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${index}`}>
          {index > 0 && <ChevronRightIcon size={14} className="text-ink-3" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-ink-3">
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
