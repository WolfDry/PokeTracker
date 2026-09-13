import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { HuntCard } from "@/components/hunt-counter";
import { PageSkeleton } from "@/components/page-skeleton";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { ShinyCard } from "@/components/shiny-card";
import { accentButton, dangerButton, linkButton } from "@/components/ui";
import { getHunts, getShinies, type Hunt } from "@/lib/data/shiny";
import { requireUser } from "@/lib/session";
import { deleteHuntAction, resumeHuntAction } from "@/lib/shiny-actions";

export const metadata: Metadata = { title: "Shiny" };

const PREVIEW_COUNT = 6;

export default function Page() {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Shiny</h1>
          <p className="text-muted">Tes chasses en cours et les shinies attrapés.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/shiny/nouvelle" className={accentButton}>
            Nouvelle chasse
          </Link>
          <Link href="/shiny/ajouter" className={linkButton}>
            Ajouter un shiny
          </Link>
        </div>
      </header>
      <Suspense fallback={<PageSkeleton />}>
        <Content />
      </Suspense>
    </div>
  );
}

const numberFr = new Intl.NumberFormat("fr-FR");

async function Content() {
  const user = await requireUser("/shiny");
  const [hunts, shinies] = await Promise.all([getHunts(user.id), getShinies(user.id)]);
  const active = hunts.filter((h) => h.status === "ACTIVE");
  const paused = hunts.filter((h) => h.status === "ABANDONED");

  // Par jeu, le jeu de la chasse la plus récente en premier.
  const byGame = new Map<number, { version: Hunt["version"]; hunts: Hunt[] }>();
  for (const hunt of active) {
    const group = byGame.get(hunt.version.id) ?? { version: hunt.version, hunts: [] };
    group.hunts.push(hunt);
    byGame.set(hunt.version.id, group);
  }

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-lg font-medium">
          Chasses en cours {active.length > 0 && <span className="text-sm font-normal text-muted">({active.length})</span>}
        </h2>
        {active.length === 0 ? (
          <p className="rounded-lg border border-border bg-card p-4 text-muted">
            Aucune chasse en cours.{" "}
            <Link href="/shiny/nouvelle" className="underline hover:text-foreground">
              Lance ta première chasse
            </Link>{" "}
            : choisis un Pokémon et un jeu, puis compte les rencontres.
          </p>
        ) : (
          [...byGame.values()].map((group) => (
            <div key={group.version.id} className="space-y-2">
              <h3 className="text-sm text-muted">{group.version.nameFr}</h3>
              <ul className="grid gap-2 md:grid-cols-2">
                {group.hunts.map((hunt) => (
                  <HuntCard key={hunt.id} hunt={hunt} />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      {paused.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">
            Chasses en pause <span className="text-sm font-normal text-muted">({paused.length})</span>
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {paused.map((hunt) => (
              <li key={hunt.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
                <PokemonSprite pokemonId={hunt.species.pokemonId} alt="" size={40} shiny />
                <Link href={`/shiny/chasse/${hunt.id}`} className="font-medium hover:text-accent">
                  {hunt.species.nameFr}
                </Link>
                <span className="text-muted">
                  {hunt.version.nameFr} · {numberFr.format(hunt.count)} rencontres
                  {hunt.method && ` · ${hunt.method}`}
                </span>
                <div className="ml-auto flex gap-2">
                  <form action={resumeHuntAction.bind(null, hunt.id)}>
                    <button type="submit" className={linkButton}>
                      Reprendre
                    </button>
                  </form>
                  <form action={deleteHuntAction.bind(null, hunt.id)}>
                    <ConfirmButton message={`Supprimer la chasse de ${hunt.species.nameFr} dans ${hunt.version.nameFr} ?`} className={dangerButton}>
                      Supprimer
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-medium">
            Mes shinies {shinies.length > 0 && <span className="text-sm font-normal text-muted">({shinies.length})</span>}
          </h2>
          {shinies.length > 0 && (
            <Link href="/shiny/galerie" className="text-sm underline hover:text-accent">
              Voir la galerie
            </Link>
          )}
        </div>
        {shinies.length === 0 ? (
          <p className="text-sm text-muted">
            Aucun shiny pour l&apos;instant. Ils arrivent ici à la fin d&apos;une chasse, ou{" "}
            <Link href="/shiny/ajouter" className="underline hover:text-foreground">
              ajoute-en un
            </Link>{" "}
            obtenu autrement.
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {shinies.slice(0, PREVIEW_COUNT).map((shiny) => (
              <ShinyCard key={shiny.id} shiny={shiny} compact />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
