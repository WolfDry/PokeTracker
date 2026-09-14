import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/auth-page";
import { Breadcrumb } from "@/components/breadcrumb";
import { card } from "@/components/ui";
import { NewHuntForm } from "@/components/shiny-forms";
import { requireUser } from "@/lib/session";
import { loadShinyFormProps } from "../form-props";

export const metadata: Metadata = { title: "Nouvelle chasse shiny" };

export default function Page({ searchParams }: PageProps<"/shiny/nouvelle">) {
  return (
    <div className="mx-auto max-w-xl space-y-8">
      <Breadcrumb items={[{ href: "/shiny", label: "Shiny" }, { label: "Nouvelle chasse" }]} />
      <header className="space-y-2">
        <h1 className="t-display">Nouvelle chasse</h1>
        <p className="text-ink-2">Choisis le Pokémon et le jeu, puis compte tes rencontres. Tu peux mener plusieurs chasses en même temps.</p>
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
  return <NewHuntForm games={games} initial={initial} />;
}
