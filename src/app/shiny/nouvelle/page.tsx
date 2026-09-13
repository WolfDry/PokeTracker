import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/auth-page";
import { NewHuntForm } from "@/components/shiny-forms";
import { requireUser } from "@/lib/session";
import { loadShinyFormProps } from "../form-props";

export const metadata: Metadata = { title: "Nouvelle chasse shiny" };

export default function Page({ searchParams }: PageProps<"/shiny/nouvelle">) {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="space-y-1">
        <nav className="text-sm text-muted">
          <Link href="/shiny" className="hover:text-foreground">
            Shiny
          </Link>{" "}
          › Nouvelle chasse
        </nav>
        <h1 className="text-2xl font-semibold">Nouvelle chasse</h1>
        <p className="text-muted">Choisis le Pokémon et le jeu, puis compte tes rencontres. Tu peux mener plusieurs chasses en même temps.</p>
      </header>
      <div className="rounded-lg border border-border bg-card p-6">
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
