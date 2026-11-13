import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/auth-page";
import { Breadcrumb } from "@/components/breadcrumb";
import { card } from "@/components/ui";
import { NewHuntForm } from "@/components/shiny-forms";
import { requireUser } from "@/lib/session";
import { loadShinyFormProps } from "@/lib/data/shiny-form";

export const metadata: Metadata = { title: "Nouvelle shasse shiny" };

export default function Page({ searchParams }: PageProps<"/shiny/nouvelle">) {
  return (
    <div className="mx-auto max-w-xl space-y-8">
      <Breadcrumb items={[{ href: "/shiny", label: "Shiny" }, { label: "Nouvelle shasse" }]} />
      <header className="space-y-2">
        <h1 className="t-display">Nouvelle shasse</h1>
        <p className="text-ink-2">Choisis le Pokémon et le jeu, puis compte tes rencontres. Tu peux mener plusieurs shiny en même temps.</p>
      </header>
      <div className={`${card} p-6 sm:p-8`}>
        <Suspense fallback={<AuthFormSkeleton fields={4} />}>
          <Form searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Form({ searchParams }: Pick<PageProps<"/shiny/nouvelle">, "searchParams">) {
  await requireUser("/shiny/nouvelle");
  const { games, initial } = await loadShinyFormProps(searchParams);
  // La page déjà visitée est gardée en vie par le routeur : sans `key`, revenir avec une autre
  // `?espece=` réafficherait l'espèce choisie la fois précédente.
  return <NewHuntForm key={`${initial.species?.pokemonId ?? ""}-${initial.versionId ?? ""}`} games={games} initial={initial} />;
}
