import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { HuntCard } from "@/components/hunt-counter";
import { ArrowRightIcon, PlusIcon } from "@/components/icons";
import { PageHeader, SectionHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { ShinyCard } from "@/components/shiny-card";
import { card, dangerButton, notice, primaryButton, secondaryButton, smallButton, spriteBox, textLink } from "@/components/ui";
import { getHunts, getShinies, type Hunt } from "@/lib/data/shiny";
import { requireUser } from "@/lib/session";
import { deleteHuntAction, resumeHuntAction } from "@/lib/shiny-actions";

export const metadata: Metadata = { title: "Shiny" };

const PREVIEW_COUNT = 6;

export default function Page() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Collection"
        title="Shiny"
        intro="Tes chasses en cours et les shinies attrapés."
        actions={
          <>
            <Link href="/shiny/nouvelle" className={primaryButton}>
              <PlusIcon size={18} /> Nouvelle chasse
            </Link>
            <Link href="/shiny/ajouter" className={secondaryButton}>
              Ajouter un shiny
            </Link>
          </>
        }
      />
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
        <SectionHeader title="Chasses en cours" aside={active.length > 0 ? `${active.length}` : undefined} />
        {active.length === 0 ? (
          <p className={notice}>
            Aucune chasse en cours.{" "}
            <Link href="/shiny/nouvelle" className={textLink}>
              Lance ta première chasse
            </Link>{" "}
            : choisis un Pokémon et un jeu, puis compte les rencontres.
          </p>
        ) : (
          <div className="space-y-6">
            {[...byGame.values()].map((group) => (
              <div key={group.version.id} className="space-y-2">
                <h3 className="t-caption">{group.version.nameFr}</h3>
                <ul className="grid gap-3 md:grid-cols-2">
                  {group.hunts.map((hunt) => (
                    <HuntCard key={hunt.id} hunt={hunt} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {paused.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Chasses en pause" aside={`${paused.length}`} />
          <ul className={`${card} divide-y divide-line`}>
            {paused.map((hunt) => (
              <li key={hunt.id} className="flex flex-wrap items-center gap-3 px-4 py-3 t-small">
                <span className={`${spriteBox} size-10 rounded-sm`}>
                  <PokemonSprite pokemonId={hunt.species.pokemonId} alt="" size={40} shiny />
                </span>
                <Link href={`/shiny/chasse/${hunt.id}`} className="font-semibold text-ink hover:underline">
                  {hunt.species.nameFr}
                </Link>
                <span className="text-ink-2">
                  {hunt.version.nameFr} · {numberFr.format(hunt.count)} rencontres
                  {hunt.method && ` · ${hunt.method}`}
                </span>
                <div className="ml-auto flex gap-2">
                  <form action={resumeHuntAction.bind(null, hunt.id)}>
                    <button type="submit" className={`${secondaryButton} ${smallButton}`}>
                      Reprendre
                    </button>
                  </form>
                  <form action={deleteHuntAction.bind(null, hunt.id)}>
                    <ConfirmButton message={`Supprimer la chasse de ${hunt.species.nameFr} dans ${hunt.version.nameFr} ?`} className={`${dangerButton} ${smallButton} border-0`}>
                      Supprimer
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4">
        <SectionHeader
          title="Mes shinies"
          aside={
            shinies.length > 0 && (
              <Link href="/shiny/galerie" className="inline-flex items-center gap-1 font-semibold text-ink hover:underline">
                Galerie · {shinies.length} <ArrowRightIcon size={14} />
              </Link>
            )
          }
        />
        {shinies.length === 0 ? (
          <p className="t-small text-ink-2">
            Aucun shiny pour l&apos;instant. Ils arrivent ici à la fin d&apos;une chasse, ou{" "}
            <Link href="/shiny/ajouter" className={textLink}>
              ajoute-en un
            </Link>{" "}
            obtenu autrement.
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {shinies.slice(0, PREVIEW_COUNT).map((shiny) => (
              <ShinyCard key={shiny.id} shiny={shiny} compact />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
