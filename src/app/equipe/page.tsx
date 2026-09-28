import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { TeamBuilder } from "@/components/team-builder";
import { chip } from "@/components/ui";
import { getGameOptions } from "@/lib/data/games";
import { getTeamBuilderData } from "@/lib/data/team";
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
          intro="Compose une équipe de six Pokémon disponibles dans un jeu et vois d'un coup d'œil ses faiblesses et ses avantages de types."
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

  // Un Pokémon absent du jeu (lien d'une équipe composée dans un autre jeu) laisse son emplacement vide.
  const initialTeam = decodeTeam(equipe, new Set(data.options.map((o) => o.pokemonId)));
  return <TeamBuilder key={data.game.slug} data={data} games={games} initialTeam={initialTeam} />;
}
