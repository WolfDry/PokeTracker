import type { Metadata } from "next";
import { getVersionBySlug, getVersionSlugs } from "@/lib/data/games";
import { GamePokedex } from "./game-pokedex";

export async function generateStaticParams() {
  const slugs = await getVersionSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/jeux/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const version = await getVersionBySlug(slug);
  return { title: version ? `Pokédex ${version.nameFr}` : "Jeu introuvable" };
}

export default async function GamePage({ params }: PageProps<"/jeux/[slug]">) {
  const { slug } = await params;
  return <GamePokedex versionSlug={slug} />;
}
