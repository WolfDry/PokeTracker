import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { TeamBuilder } from "@/components/team-builder";
import { chip } from "@/components/ui";
import { getGameOptions } from "@/lib/data/games";
import { getLearnableMoves } from "@/lib/data/moves";
import { getTeamBuilderData } from "@/lib/data/team";
import { toTeamMove } from "@/lib/moves";
import { decodeTeam } from "@/lib/team";

export const metadata: Metadata = { title: "Équipe" };

export default function Page({ searchParams }: PageProps<"/equipe">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TeamPage searchParams={searchParams} />
    </Suspense>
  );
}

async function TeamPage({ searchParams }: Pick<PageProps<"/equipe">, "searchParams">) {
  const { jeu, equipe } = await searchParams;
  const [games, data] = await Promise.all([getGameOptions(), typeof jeu === "string" ? getTeamBuilderData(jeu) : null]);

  if (!data) {
    return (
      <div className="space-y-10">
        <PageHeader
          eyebrow="Stratégie"
          title="Équipe"
          intro="Compose une équipe de six Pokémon disponibles dans un jeu, choisis leurs attaques et vois d'un coup d'œil ses faiblesses et ses avantages de types."
        />
        <section className="space-y-4">
          <h2 className="t-h2">Choisir un jeu</h2>
          <div className="space-y-3">
            {games.map((generation) => (
              <div key={generation.id} className="flex flex-wrap items-center gap-2">
                <span className="w-full t-caption sm:w-32">{generation.nameFr}</span>
                {generation.versions.map((version) => (
                  <Link key={version.id} href={`/equipe?jeu=${version.slug}`} className={chip(false)}>
                    {version.nameFr}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Un Pokémon absent du jeu (lien d'une équipe composée dans un autre jeu) laisse son emplacement vide,
  // une capacité qu'il ne peut pas apprendre dans ce jeu est ignorée.
  const slots = decodeTeam(equipe, new Set(data.options.map((o) => o.pokemonId)));
  const initialTeam = await Promise.all(
    slots.map(async (slot) => {
      if (!slot) return null;
      const learnable = new Map((await getLearnableMoves(data.game.slug, slot.pokemonId)).map((m) => [m.id, m]));
      const moves = slot.moveIds.flatMap((id) => {
        const move = learnable.get(id);
        return move ? [toTeamMove(move)] : [];
      });
      return { pokemonId: slot.pokemonId, moves };
    }),
  );
  return <TeamBuilder key={data.game.slug} data={data} games={games} initialTeam={initialTeam} />;
}
