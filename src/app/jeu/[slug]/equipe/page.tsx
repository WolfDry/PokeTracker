import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PlusIcon } from "@/components/icons";
import { SectionHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { TeamSprites } from "@/components/team-sprites";
import { cardLink, notice, primaryButton, smallButton } from "@/components/ui";
import { getGame } from "@/lib/data/games";
import { getTeams } from "@/lib/data/teams";
import { requireUser } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/jeu/[slug]/equipe">): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  return { title: game ? `Équipes — ${game.nameFr}` : "Jeu introuvable" };
}

export default async function Page({ params }: PageProps<"/jeu/[slug]/equipe">) {
  const { slug } = await params;
  const game = await getGame(slug);
  // Pas d'équipe pour le National : aucun jeu jouable derrière.
  if (game?.kind !== "version") notFound();

  return (
    <Suspense fallback={<PageSkeleton />}>
      <Teams slug={slug} versionId={game.id} />
    </Suspense>
  );
}

const dateFr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

/** Équipes sauvegardées du jeu, la dernière modifiée en premier. */
async function Teams({ slug, versionId }: { slug: string; versionId: number }) {
  const user = await requireUser(`/jeu/${slug}/equipe`);
  const teams = await getTeams(user.id, versionId);
  const newHref = `/jeu/${slug}/equipe/nouvelle`;

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Mes équipes"
        aside={
          <Link href={newHref} className={`${primaryButton} ${smallButton}`}>
            <PlusIcon size={16} /> Nouvelle équipe
          </Link>
        }
      />
      {teams.length === 0 ? (
        <p className={notice}>Aucune équipe pour ce jeu. Compose ta première équipe, choisis ses attaques et sauvegarde-la pour la retrouver ici.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {teams.map((team) => (
            <li key={team.id}>
              <Link href={`/jeu/${slug}/equipe/${team.id}`} className={`${cardLink} flex flex-col gap-3 p-4`}>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-semibold">{team.name}</span>
                  <span className="shrink-0 t-small text-ink-3">Modifiée le {dateFr.format(team.updatedAt)}</span>
                </span>
                <TeamSprites slots={team.slots} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
