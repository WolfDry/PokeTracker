import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { UpdateNameForm } from "@/components/auth-forms";
import { signOutAction } from "@/lib/auth-actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Mon compte" };

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Mon compte</h1>
      <Suspense fallback={<AccountSkeleton />}>
        <Account />
      </Suspense>
    </div>
  );
}

const dateFr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

async function Account() {
  const user = await requireUser("/compte");
  // Données propres à l'utilisateur : lues à la requête, jamais en `use cache` partagé.
  const [captures, hunts, shinies] = await Promise.all([
    prisma.capture.count({ where: { userId: user.id } }),
    prisma.shinyHunt.count({ where: { userId: user.id, status: "ACTIVE" } }),
    prisma.shinyCapture.count({ where: { userId: user.id } }),
  ]);

  return (
    <>
      <section className="rounded-lg border border-border bg-card p-6">
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-muted">Adresse e-mail</dt>
          <dd>{user.email}</dd>
          <dt className="text-muted">Membre depuis</dt>
          <dd>{dateFr.format(user.createdAt)}</dd>
        </dl>
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-6">
        <h2 className="font-medium">Modifier mon pseudo</h2>
        <p className="text-sm text-muted">Affiché dans l&apos;en-tête ; il ne sert pas à te connecter.</p>
        <UpdateNameForm currentName={user.name} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Captures" value={captures} href="/captures" />
        <Stat label="Chasses shiny en cours" value={hunts} href="/shiny" />
        <Stat label="Shinies attrapés" value={shinies} href="/shiny/galerie" />
      </section>

      <form action={signOutAction}>
        <button type="submit" className="rounded-md border border-border px-4 py-2 text-sm hover:bg-card">
          Se déconnecter
        </button>
      </form>
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </Link>
  );
}

function AccountSkeleton() {
  return (
    <div aria-hidden className="animate-pulse space-y-6">
      <div className="h-24 rounded-lg border border-border bg-card" />
      <div className="h-36 rounded-lg border border-border bg-card" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-20 rounded-lg border border-border bg-card" />
        <div className="h-20 rounded-lg border border-border bg-card" />
        <div className="h-20 rounded-lg border border-border bg-card" />
      </div>
    </div>
  );
}
