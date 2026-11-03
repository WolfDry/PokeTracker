import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { getGame } from "@/lib/data/games";
import { TeamEditorPage } from "../editor";

export async function generateMetadata({ params }: PageProps<"/jeu/[slug]/equipe/nouvelle">): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  return { title: game ? `Nouvelle équipe — ${game.nameFr}` : "Jeu introuvable" };
}

/** Nouvelle équipe, vide ou reprise d'un lien partagé (`?equipe=`) ; elle n'existe qu'une fois sauvegardée. */
export default async function Page({ params, searchParams }: PageProps<"/jeu/[slug]/equipe/nouvelle">) {
  const { slug } = await params;
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TeamEditorPage slug={slug} teamId={null} searchParams={searchParams} />
    </Suspense>
  );
}
