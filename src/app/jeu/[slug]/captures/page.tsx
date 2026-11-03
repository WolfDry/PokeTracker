import type { Metadata } from "next";
import { notice } from "@/components/ui";
import { getGame } from "@/lib/data/games";

export async function generateMetadata({ params }: PageProps<"/jeu/[slug]/captures">): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  return { title: game ? `Living dex — ${game.nameFr}` : "Jeu introuvable" };
}

// Coquille de l'onglet : la checklist arrive à l'étape « living dex ».
export default function Page() {
  return <p className={notice}>Le living dex de ce jeu arrive bientôt.</p>;
}
