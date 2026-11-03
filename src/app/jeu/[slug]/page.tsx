import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowRightIcon, BallIcon, StarIcon, TeamIcon } from "@/components/icons";
import { cardLink } from "@/components/ui";
import { getGame } from "@/lib/data/games";

export async function generateMetadata({ params }: PageProps<"/jeu/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  return { title: game ? game.nameFr : "Jeu introuvable" };
}

type Feature = { href: string; title: string; text: string; icon: ComponentType<{ size?: number }> };

/** Résumé du jeu : une carte par fonctionnalité (le jeu est vérifié par le layout). */
export default async function GamePage({ params }: PageProps<"/jeu/[slug]">) {
  const { slug } = await params;
  const game = await getGame(slug);
  const base = `/jeu/${slug}`;

  const features: Feature[] = [
    { href: `${base}/captures`, title: "Living dex", text: "Coche chaque espèce attrapée dans ce jeu et vois où trouver celles qui manquent.", icon: BallIcon },
    { href: `${base}/shiny`, title: "Shiny dex", text: "Les mêmes espèces, en version chromatique, avec tes chasses en cours.", icon: StarIcon },
  ];
  if (game?.kind !== "national") {
    features.push({ href: `${base}/equipe`, title: "Équipe", text: "Compose ton équipe de six, choisis ses attaques et sauvegarde-la.", icon: TeamIcon });
  }

  return (
    <section aria-label="Fonctionnalités" className={`grid gap-3 sm:gap-4 ${features.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
      {features.map(({ href, title, text, icon: Icon }) => (
        <Link key={href} href={href} className={`${cardLink} group flex flex-col gap-3 p-5 sm:p-6`}>
          <span className="grid size-10 place-items-center rounded-full bg-game-soft text-game-text">
            <Icon size={20} />
          </span>
          <span className="t-h2">{title}</span>
          <span className="flex-1 t-small text-ink-2">{text}</span>
          <span className="flex items-center gap-1.5 t-small font-semibold text-game-text">
            Ouvrir
            <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </section>
  );
}
