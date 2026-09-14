import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader, SectionHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { ShinyCard } from "@/components/shiny-card";
import { notice, primaryButton, textLink } from "@/components/ui";
import { getPokedexHrefs } from "@/lib/data/pokedex-pages";
import { getShinies, type Shiny } from "@/lib/data/shiny";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Galerie shiny" };

export default function Page() {
  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ href: "/shiny", label: "Shiny" }, { label: "Galerie" }]} />
      <PageHeader
        eyebrow="Collection"
        title="Galerie shiny"
        intro="Tous tes shinies, jeu par jeu."
        actions={
          <Link href="/shiny/ajouter" className={primaryButton}>
            Ajouter un shiny
          </Link>
        }
      />
      <Suspense fallback={<PageSkeleton />}>
        <Gallery />
      </Suspense>
    </div>
  );
}

async function Gallery() {
  const user = await requireUser("/shiny/galerie");
  const [shinies, pokedexHrefs] = await Promise.all([getShinies(user.id), getPokedexHrefs()]);
  if (shinies.length === 0) {
    return (
      <p className={notice}>
        Aucun shiny pour l&apos;instant. Termine une{" "}
        <Link href="/shiny" className={textLink}>
          chasse
        </Link>{" "}
        ou{" "}
        <Link href="/shiny/ajouter" className={textLink}>
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
    <div className="space-y-10">
      <p className="t-small text-ink-2">
        {shinies.length} shiny{shinies.length > 1 ? "s" : ""} dans {groups.length} jeu{groups.length > 1 ? "x" : ""}.
      </p>
      {groups.map((group) => (
        <section key={group.version.id} className="space-y-4">
          <SectionHeader
            title={
              <Link href={pokedexHrefs[group.version.slug] ?? "/pokedex"} className="hover:underline">
                {group.version.nameFr}
              </Link>
            }
            aside={`${group.shinies.length}`}
          />
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
