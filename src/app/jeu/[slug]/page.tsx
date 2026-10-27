import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameSync } from "@/components/game-sync";
import { PageHeader } from "@/components/page-header";
import { getGame, getGameOptions } from "@/lib/data/games";
import { NATIONAL_SLUG } from "@/lib/game";

export async function generateStaticParams() {
  const generations = await getGameOptions();
  return [NATIONAL_SLUG, ...generations.flatMap((g) => g.versions.map((v) => v.slug))].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/jeu/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  return { title: game ? game.nameFr : "Jeu introuvable" };
}

export default async function GamePage({ params }: PageProps<"/jeu/[slug]">) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) notFound();

  return (
    <div className="space-y-8">
      <GameSync game={game} />
      <PageHeader eyebrow={game.kind === "national" ? "Pokédex National" : game.generation.nameFr} title={game.nameFr} />
    </div>
  );
}
