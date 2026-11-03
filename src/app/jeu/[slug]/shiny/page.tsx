import type { Metadata } from "next";
import { notice } from "@/components/ui";
import { getGame } from "@/lib/data/games";

export async function generateMetadata({ params }: PageProps<"/jeu/[slug]/shiny">): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  return { title: game ? `Shiny dex — ${game.nameFr}` : "Jeu introuvable" };
}

// Coquille de l'onglet : la checklist shiny arrive à l'étape « shiny dex ».
export default function Page() {
  return <p className={notice}>Le shiny dex de ce jeu arrive bientôt.</p>;
}
