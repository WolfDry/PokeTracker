import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { ShinyCard } from "@/components/shiny-card";
import { accentButton } from "@/components/ui";
import { getShinies, type Shiny } from "@/lib/data/shiny";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Galerie shiny" };

export default function Page() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <nav className="text-sm text-muted">
          <Link href="/shiny" className="hover:text-foreground">
            Shiny
          </Link>{" "}
          › Galerie
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Galerie shiny</h1>
            <p className="text-muted">Tous tes shinies, jeu par jeu.</p>
          </div>
          <Link href="/shiny/ajouter" className={accentButton}>
            Ajouter un shiny
          </Link>
        </div>
      </header>
      <Suspense fallback={<PageSkeleton />}>
        <Gallery />
      </Suspense>
    </div>
  );
}

async function Gallery() {
  const user = await requireUser("/shiny/galerie");
  const shinies = await getShinies(user.id);
  if (shinies.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card p-4 text-muted">
        Aucun shiny pour l&apos;instant. Termine une{" "}
        <Link href="/shiny" className="underline hover:text-foreground">
          chasse
        </Link>{" "}
        ou{" "}
        <Link href="/shiny/ajouter" className="underline hover:text-foreground">
          ajoute un shiny
        </Link>{" "}
        obtenu autrement.
      </p>
    );
  }

  // Par jeu dans l'ordre des générations (id de version croissant), les plus récents d'abord dans chaque jeu.
  const byGame = new Map<number, { version: Shiny["version"]; shinies: Shiny[] }>();
  for (const shiny of shinies) {
    const group = byGame.get(shiny.version.id) ?? { version: shiny.version, shinies: [] };
    group.shinies.push(shiny);
    byGame.set(shiny.version.id, group);
  }
  const groups = [...byGame.values()].sort((a, b) => a.version.id - b.version.id);

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted">
        {shinies.length} shiny{shinies.length > 1 ? "s" : ""} dans {groups.length} jeu{groups.length > 1 ? "x" : ""}.
      </p>
      {groups.map((group) => (
        <section key={group.version.id} className="space-y-3">
          <h2 className="text-lg font-medium">
            <Link href={`/jeux/${group.version.slug}`} className="hover:text-accent">
              {group.version.nameFr}
            </Link>{" "}
            <span className="text-sm font-normal text-muted">({group.shinies.length})</span>
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {group.shinies.map((shiny) => (
              <ShinyCard key={shiny.id} shiny={shiny} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
