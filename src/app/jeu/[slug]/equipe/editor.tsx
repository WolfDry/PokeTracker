import "server-only";

import { notFound } from "next/navigation";
import { TeamEditor } from "@/components/team-editor";
import { getGame } from "@/lib/data/games";
import { getTeamBuilderData } from "@/lib/data/team";
import { encodeTeamSlots, resolveTeamSlots } from "@/lib/data/team-slots";
import { getTeam } from "@/lib/data/teams";
import { requireUser } from "@/lib/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Éditeur d'une équipe du jeu (`teamId`) ou d'une nouvelle équipe (`null`). L'équipe affichée est celle de l'URL
 * (`?equipe=`, modifications en cours ou lien partagé) si elle y est, sinon celle sauvegardée.
 */
export async function TeamEditorPage({ slug, teamId, searchParams }: { slug: string; teamId: string | null; searchParams: SearchParams }) {
  const user = await requireUser(`/jeu/${slug}/equipe/${teamId ?? "nouvelle"}`);
  const [game, data] = await Promise.all([getGame(slug), getTeamBuilderData(slug)]);
  if (game?.kind !== "version" || !data) notFound();

  const team = teamId ? await getTeam(user.id, game.id, teamId) : null;
  if (teamId && !team) notFound();

  const { equipe } = await searchParams;
  // Comparée à l'équipe affichée pour savoir s'il reste des modifications à sauvegarder : même normalisation.
  const savedSlots = team ? encodeTeamSlots(await resolveTeamSlots(data, team.slots)) : "";
  const initialTeam = await resolveTeamSlots(data, equipe ?? team?.slots);

  return (
    <TeamEditor
      // Une autre équipe, ou un autre lien partagé : on repart de zéro (la page visitée reste montée sinon).
      key={`${teamId ?? "nouvelle"}-${typeof equipe === "string" ? equipe : ""}`}
      data={data}
      initialTeam={initialTeam}
      saved={{ id: team?.id ?? null, name: team?.name ?? "", slots: savedSlots }}
    />
  );
}
