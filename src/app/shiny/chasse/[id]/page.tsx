import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/confirm-button";
import { HuntCounter } from "@/components/hunt-counter";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { dangerButton, linkButton } from "@/components/ui";
import { getHunt } from "@/lib/data/shiny";
import { requireUser } from "@/lib/session";
import { deleteHuntAction, pauseHuntAction, resumeHuntAction } from "@/lib/shiny-actions";

export const metadata: Metadata = { title: "Chasse shiny" };

const numberFr = new Intl.NumberFormat("fr-FR");
const dateFr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

export default async function Page({ params }: PageProps<"/shiny/chasse/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/shiny/chasse/${id}`);
  const hunt = await getHunt(user.id, id);
  if (!hunt) notFound();

  const encounters = `${numberFr.format(hunt.count)} rencontre${hunt.count > 1 ? "s" : ""}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/shiny" className="hover:text-foreground">
          Shiny
        </Link>{" "}
        › Chasse
      </nav>

      <header className="flex items-center gap-4">
        <div className="rounded-lg border border-border bg-card p-1">
          <PokemonSprite pokemonId={hunt.species.pokemonId} alt={`${hunt.species.nameFr} chromatique`} size={96} shiny />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
            <Link href={`/pokemon/${hunt.species.id}`} className="hover:text-accent">
              {hunt.species.nameFr}
            </Link>{" "}
            <span className="text-lg font-normal text-muted">dans {hunt.version.nameFr}</span>
          </h1>
          <p className="text-sm text-muted">
            {hunt.method ?? "Méthode non précisée"} · commencée le {dateFr.format(hunt.startedAt)}
          </p>
        </div>
      </header>

      {hunt.status === "ACTIVE" && <HuntCounter hunt={hunt} />}

      {hunt.status === "ABANDONED" && (
        <div className="space-y-3 rounded-lg border border-border bg-card p-6">
          <p>
            Chasse en pause à <span className="font-semibold tabular-nums">{encounters}</span>.
          </p>
          <form action={resumeHuntAction.bind(null, hunt.id)}>
            <button type="submit" className={linkButton}>
              Reprendre la chasse
            </button>
          </form>
        </div>
      )}

      {hunt.status === "COMPLETED" && (
        <div className="space-y-3 rounded-lg border border-emerald-500/50 bg-emerald-500/5 p-6">
          <p>
            ✨ Shiny trouvé{hunt.completedAt && ` le ${dateFr.format(hunt.completedAt)}`} après{" "}
            <span className="font-semibold tabular-nums">{encounters}</span>
            {hunt.capture?.nickname && (
              <>
                {" "}
                — surnommé <span className="font-medium">« {hunt.capture.nickname} »</span>
              </>
            )}
            .
          </p>
          <Link href="/shiny/galerie" className={linkButton}>
            Voir dans la galerie
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {hunt.status === "ACTIVE" && (
          <form action={pauseHuntAction.bind(null, hunt.id)}>
            <button type="submit" className={linkButton}>
              Mettre en pause
            </button>
          </form>
        )}
        <form action={deleteHuntAction.bind(null, hunt.id)} className="ml-auto">
          <ConfirmButton
            message={
              hunt.status === "COMPLETED"
                ? `Supprimer cette chasse et le shiny ${hunt.species.nameFr} qui en est issu ?`
                : `Supprimer la chasse de ${hunt.species.nameFr} dans ${hunt.version.nameFr} (${encounters}) ?`
            }
            className={dangerButton}
          >
            Supprimer la chasse
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
