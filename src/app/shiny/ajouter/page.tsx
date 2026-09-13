import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/auth-page";
import { AddShinyForm } from "@/components/shiny-forms";
import { requireUser } from "@/lib/session";
import { loadShinyFormProps } from "../form-props";

export const metadata: Metadata = { title: "Ajouter un shiny" };

export default function Page({ searchParams }: PageProps<"/shiny/ajouter">) {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="space-y-1">
        <nav className="text-sm text-muted">
          <Link href="/shiny" className="hover:text-foreground">
            Shiny
          </Link>{" "}
          › Ajouter un shiny
        </nav>
        <h1 className="text-2xl font-semibold">Ajouter un shiny</h1>
        <p className="text-muted">Un shiny obtenu sans chasse comptée : full odds, œuf, échange, événement…</p>
      </header>
      <div className="rounded-lg border border-border bg-card p-6">
        <Suspense fallback={<AuthFormSkeleton fields={6} />}>
          <Form searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Form({ searchParams }: Pick<PageProps<"/shiny/ajouter">, "searchParams">) {
  await requireUser("/shiny/ajouter");
  const { games, initial } = await loadShinyFormProps(searchParams);
  return <AddShinyForm games={games} initial={initial} />;
}
