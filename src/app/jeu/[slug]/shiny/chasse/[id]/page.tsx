import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { HuntDetail } from "@/components/hunt-detail";
import { PageSkeleton } from "@/components/page-skeleton";
import { getGame } from "@/lib/data/games";
import { getHunt } from "@/lib/data/shiny";
import { requireUser } from "@/lib/session";
import { huntHref } from "@/lib/shiny";
import { BackToShinyDex } from "../../back-link";

export async function generateMetadata({ params }: PageProps<"/jeu/[slug]/shiny/chasse/[id]">): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  return { title: game ? `Chasse shiny — ${game.nameFr}` : "Jeu introuvable" };
}

/** Une chasse, dans l'onglet Shiny dex de son jeu. */
export default function Page({ params }: PageProps<"/jeu/[slug]/shiny/chasse/[id]">) {
  // L'id de la chasse n'est connu qu'à la requête : il se lit sous le <Suspense>, la coquille reste statique.
  return (
    <Suspense fallback={<PageSkeleton />}>
      {params.then(({ slug, id }) => (
        <Hunt slug={slug} id={id} />
      ))}
    </Suspense>
  );
}

async function Hunt({ slug, id }: { slug: string; id: string }) {
  const user = await requireUser(huntHref(slug, id));
  const hunt = await getHunt(user.id, id);
  if (!hunt) notFound();
  // Ouverte depuis un autre jeu (au National, ou lien ancien) : on la montre dans le sien.
  if (hunt.version.slug !== slug) redirect(huntHref(hunt.version.slug, id));

  return (
    <div className="space-y-6">
      <BackToShinyDex slug={slug} />
      <HuntDetail hunt={hunt} />
    </div>
  );
}
