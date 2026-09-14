import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { UpdateNameForm } from "@/components/auth-forms";
import { PageHeader } from "@/components/page-header";
import { card, cardLink, secondaryButton } from "@/components/ui";
import { signOutAction } from "@/lib/auth-actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Mon compte" };

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader eyebrow="Profil" title="Mon compte" />
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
      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Captures" value={captures} href="/captures" />
        <Stat label="Chasses en cours" value={hunts} href="/shiny" />
        <Stat label="Shinies attrapés" value={shinies} href="/shiny/galerie" />
      </section>

      <section className={`${card} p-6`}>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-[auto_1fr]">
          <dt className="t-caption self-center">Adresse e-mail</dt>
          <dd>{user.email}</dd>
          <dt className="t-caption self-center">Membre depuis</dt>
          <dd>{dateFr.format(user.createdAt)}</dd>
        </dl>
      </section>

      <section className={`${card} space-y-4 p-6`}>
        <div className="space-y-1">
          <h2 className="t-h2">Modifier mon pseudo</h2>
          <p className="t-small text-ink-2">Affiché dans l&apos;en-tête ; il ne sert pas à te connecter.</p>
        </div>
        <UpdateNameForm currentName={user.name} />
      </section>

      <form action={signOutAction}>
        <button type="submit" className={secondaryButton}>
          Se déconnecter
        </button>
      </form>
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className={`${cardLink} space-y-1 p-5`}>
      <p className="t-h1">{value}</p>
      <p className="t-caption">{label}</p>
    </Link>
  );
}

function AccountSkeleton() {
  return (
    <div aria-hidden className="animate-pulse space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-24 rounded-lg bg-surface-2" />
        <div className="h-24 rounded-lg bg-surface-2" />
        <div className="h-24 rounded-lg bg-surface-2" />
      </div>
      <div className="h-28 rounded-lg bg-surface-2" />
      <div className="h-44 rounded-lg bg-surface-2" />
    </div>
  );
}
