import type { Metadata } from "next";
import Link from "next/link";
import { type ComponentType, type ReactNode, Suspense } from "react";
import { ArrowRightIcon, BallIcon, StarIcon, TeamIcon } from "@/components/icons";
import { ProgressBar } from "@/components/progress-bar";
import { cardLink } from "@/components/ui";
import { getDexProgress, getNationalCaptures } from "@/lib/data/captures";
import { getGame, getNationalSpeciesCount } from "@/lib/data/games";
import type { Game } from "@/lib/game";
import { requireUser } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/jeu/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  return { title: game ? game.nameFr : "Jeu introuvable" };
}

type Feature = { href: string; title: string; text: string; icon: ComponentType<{ size?: number }>; summary?: ReactNode };

/** Résumé du jeu : une carte par fonctionnalité, avec son avancement (le jeu est vérifié par le layout). */
export default async function GamePage({ params }: PageProps<"/jeu/[slug]">) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) return null;
  const base = `/jeu/${slug}`;

  const features: Feature[] = [
    {
      href: `${base}/captures`,
      title: "Living dex",
      text: "Coche chaque espèce attrapée dans ce jeu et vois où trouver celles qui manquent.",
      icon: BallIcon,
      // L'avancement lit la session : il arrive en streaming, la carte reste dans la coquille statique.
      summary: (
        <Suspense fallback={<ProgressFallback />}>
          <LivingDexProgress game={game} />
        </Suspense>
      ),
    },
    { href: `${base}/shiny`, title: "Shiny dex", text: "Les mêmes espèces, en version chromatique, avec tes chasses en cours.", icon: StarIcon },
  ];
  if (game.kind !== "national") {
    features.push({ href: `${base}/equipe`, title: "Équipe", text: "Compose ton équipe de six, choisis ses attaques et sauvegarde-la.", icon: TeamIcon });
  }

  return (
    <section aria-label="Fonctionnalités" className={`grid gap-3 sm:gap-4 ${features.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
      {features.map(({ href, title, text, icon: Icon, summary }) => (
        <Link key={href} href={href} className={`${cardLink} group flex flex-col gap-3 p-5 sm:p-6`}>
          <span className="grid size-10 place-items-center rounded-full bg-game-soft text-game-text">
            <Icon size={20} />
          </span>
          <span className="t-h2">{title}</span>
          <span className="t-small text-ink-2">{text}</span>
          <div className="flex-1">{summary}</div>
          <span className="flex items-center gap-1.5 t-small font-semibold text-game-text">
            Ouvrir
            <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </section>
  );
}

/** Avancement du living dex : chaque Pokédex du jeu, ou le National tous jeux confondus. */
async function LivingDexProgress({ game }: { game: Game }) {
  const user = await requireUser(`/jeu/${game.slug}`);
  if (game.kind === "national") {
    const [{ speciesIds }, total] = await Promise.all([getNationalCaptures(user.id), getNationalSpeciesCount()]);
    return <ProgressBar caught={speciesIds.length} total={total} label="National" />;
  }
  const dexes = await getDexProgress(user.id, game.id);
  return (
    <div className="space-y-3">
      {dexes.map((dex) => (
        <ProgressBar key={dex.id} caught={dex.caught} total={dex.total} label={dex.nameFr} />
      ))}
    </div>
  );
}

function ProgressFallback() {
  return <div aria-hidden className="h-8 animate-pulse rounded-sm bg-surface-2" />;
}
