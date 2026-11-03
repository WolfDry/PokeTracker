import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { getGame } from "@/lib/data/games";
import { TeamEditorPage } from "../editor";

export async function generateMetadata({ params }: PageProps<"/jeu/[slug]/equipe/[teamId]">): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  return { title: game ? `Équipe — ${game.nameFr}` : "Jeu introuvable" };
}

/** Une équipe sauvegardée du jeu. */
export default function Page({ params, searchParams }: PageProps<"/jeu/[slug]/equipe/[teamId]">) {
  // `teamId` n'est connu qu'à la requête : il se lit sous le <Suspense>, la coquille reste statique.
  return (
    <Suspense fallback={<PageSkeleton />}>
      {params.then(({ slug, teamId }) => (
        <TeamEditorPage slug={slug} teamId={teamId} searchParams={searchParams} />
      ))}
    </Suspense>
  );
}
