import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { HuntDetail } from "@/components/hunt-detail";
import { getHunt } from "@/lib/data/shiny";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Chasse shiny" };

// Ancienne adresse d'une chasse, gardée en attendant la suppression des routes /shiny : même contenu que
// /jeu/[jeu]/shiny/chasse/[id].
export default async function Page({ params }: PageProps<"/shiny/chasse/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/shiny/chasse/${id}`);
  const hunt = await getHunt(user.id, id);
  if (!hunt) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Breadcrumb items={[{ href: "/shiny", label: "Shiny" }, { label: "Chasse" }]} />
      <HuntDetail hunt={hunt} />
    </div>
  );
}
