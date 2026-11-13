import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { HuntDetail } from "@/components/hunt-detail";
import { getHunt } from "@/lib/data/shiny";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Shasse shiny" };

// Ancienne adresse d'une shasse, gardée en attendant la suppression des routes /shiny : même contenu que
// /jeu/[jeu]/shiny/shasse/[id].
export default async function Page({ params }: PageProps<"/shiny/shasse/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/shiny/shasse/${id}`);
  const hunt = await getHunt(user.id, id);
  if (!hunt) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Breadcrumb items={[{ href: "/shiny", label: "Shiny" }, { label: "Shasse" }]} />
      <HuntDetail hunt={hunt} />
    </div>
  );
}
