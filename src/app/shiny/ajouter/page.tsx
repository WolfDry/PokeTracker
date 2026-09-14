import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/auth-page";
import { Breadcrumb } from "@/components/breadcrumb";
import { card } from "@/components/ui";
import { AddShinyForm } from "@/components/shiny-forms";
import { requireUser } from "@/lib/session";
import { loadShinyFormProps } from "../form-props";

export const metadata: Metadata = { title: "Ajouter un shiny" };

export default function Page({ searchParams }: PageProps<"/shiny/ajouter">) {
  return (
    <div className="mx-auto max-w-xl space-y-8">
      <Breadcrumb items={[{ href: "/shiny", label: "Shiny" }, { label: "Ajouter un shiny" }]} />
      <header className="space-y-2">
        <h1 className="t-display">Ajouter un shiny</h1>
        <p className="text-ink-2">Un shiny obtenu sans chasse comptée : full odds, œuf, échange, événement…</p>
      </header>
      <div className={`${card} p-6 sm:p-8`}>
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
