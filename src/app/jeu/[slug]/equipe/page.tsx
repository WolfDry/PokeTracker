import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { notice } from "@/components/ui";
import { getGame } from "@/lib/data/games";

export async function generateMetadata({ params }: PageProps<"/jeu/[slug]/equipe">): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  return { title: game ? `Équipe — ${game.nameFr}` : "Jeu introuvable" };
}

// Coquille de l'onglet : l'équipe sauvegardée arrive à l'étape « équipe ».
export default async function Page({ params }: PageProps<"/jeu/[slug]/equipe">) {
  const { slug } = await params;
  // Pas d'équipe pour le National : aucun jeu jouable derrière.
  if ((await getGame(slug))?.kind !== "version") notFound();
  return <p className={notice}>L&apos;équipe de ce jeu arrive bientôt.</p>;
}
