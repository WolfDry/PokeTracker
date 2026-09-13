import type { Metadata } from "next";
import { getVersionBySlug } from "@/lib/data/games";
import { GamePokedex } from "../game-pokedex";

export async function generateMetadata({ params }: PageProps<"/jeux/[slug]/[dex]">): Promise<Metadata> {
  const { slug, dex } = await params;
  const version = await getVersionBySlug(slug);
  const pokedex = version?.pokedexes.find((p) => p.slug === dex);
  return { title: version && pokedex ? `Pokédex ${pokedex.nameFr} · ${version.nameFr}` : "Pokédex introuvable" };
}

export default async function GameDexPage({ params }: PageProps<"/jeux/[slug]/[dex]">) {
  const { slug, dex } = await params;
  return <GamePokedex versionSlug={slug} dexSlug={dex} />;
}
