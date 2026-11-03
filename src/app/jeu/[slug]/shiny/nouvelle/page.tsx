import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/auth-page";
import { NewHuntForm } from "@/components/shiny-forms";
import { card } from "@/components/ui";
import { getGame } from "@/lib/data/games";
import { loadShinyFormProps } from "@/lib/data/shiny-form";
import { requireUser } from "@/lib/session";
import { BackToShinyDex } from "../back-link";

export async function generateMetadata({ params }: PageProps<"/jeu/[slug]/shiny/nouvelle">): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  return { title: game ? `Nouvelle chasse — ${game.nameFr}` : "Jeu introuvable" };
}

/** Nouvelle chasse : dans un jeu, le jeu est fixé ; au National, on le choisit. `?espece=&forme=` présélectionne le Pokémon. */
export default async function Page({ params, searchParams }: PageProps<"/jeu/[slug]/shiny/nouvelle">) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) notFound();
  const fixedVersionId = game.kind === "version" ? game.id : undefined;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <BackToShinyDex slug={slug} />
      <header className="space-y-2">
        <h2 className="t-h1">Nouvelle chasse</h2>
        <p className="text-ink-2">
          {fixedVersionId ? "Choisis le Pokémon" : "Choisis le Pokémon et le jeu"}, puis compte tes rencontres. Tu peux mener plusieurs chasses en même temps.
        </p>
      </header>
      <div className={`${card} p-6 sm:p-8`}>
        <Suspense fallback={<AuthFormSkeleton fields={fixedVersionId ? 3 : 4} />}>
          <Form slug={slug} fixedVersionId={fixedVersionId} searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Form({ slug, fixedVersionId, searchParams }: { slug: string; fixedVersionId?: number; searchParams: PageProps<"/jeu/[slug]/shiny/nouvelle">["searchParams"] }) {
  await requireUser(`/jeu/${slug}/shiny/nouvelle`);
  const { games, initial } = await loadShinyFormProps(searchParams, fixedVersionId ? slug : undefined);
  // La page déjà visitée reste montée : la `key` repart de l'espèce (et de sa forme) passée dans l'URL.
  return <NewHuntForm key={`${initial.species?.pokemonId ?? ""}`} games={games} initial={initial} fixedVersionId={fixedVersionId} />;
}
