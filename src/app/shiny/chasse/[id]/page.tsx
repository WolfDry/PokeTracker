import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { ConfirmButton } from "@/components/confirm-button";
import { HuntCounter } from "@/components/hunt-counter";
import { StarIcon } from "@/components/icons";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { card, dangerButton, secondaryButton, smallButton, spriteBox } from "@/components/ui";
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
    <div className="mx-auto max-w-2xl space-y-8">
      <Breadcrumb items={[{ href: "/shiny", label: "Shiny" }, { label: "Chasse" }]} />

      <header className="flex items-center gap-5">
        <span className={`${spriteBox} size-[88px] rounded-lg`}>
          <PokemonSprite pokemonId={hunt.species.pokemonId} alt={`${hunt.species.nameFr} chromatique`} size={88} shiny />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="t-caption">{hunt.version.nameFr}</p>
          <h1 className="t-h1">
            <Link href={`/pokemon/${hunt.species.id}`} className="hover:underline">
              {hunt.species.nameFr}
            </Link>
          </h1>
          <p className="t-small text-ink-2">
            {hunt.method ?? "Méthode non précisée"} · commencée le {dateFr.format(hunt.startedAt)}
          </p>
        </div>
      </header>

      {hunt.status === "ACTIVE" && <HuntCounter hunt={hunt} />}

      {hunt.status === "ABANDONED" && (
        <div className={`${card} flex flex-wrap items-center justify-between gap-4 p-6`}>
          <p>
            Chasse en pause à <b className="font-bold">{encounters}</b>.
          </p>
          <form action={resumeHuntAction.bind(null, hunt.id)}>
            <button type="submit" className={secondaryButton}>
              Reprendre la chasse
            </button>
          </form>
        </div>
      )}

      {hunt.status === "COMPLETED" && (
        <div className={`${card} flex flex-wrap items-center gap-4 p-6`}>
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-shiny/60 text-shiny">
            <StarIcon />
          </span>
          <p className="min-w-0 flex-1">
            Shiny trouvé{hunt.completedAt && ` le ${dateFr.format(hunt.completedAt)}`} après <b className="font-bold">{encounters}</b>
            {hunt.capture?.nickname && (
              <>
                {" "}
                — surnommé <span className="font-semibold">« {hunt.capture.nickname} »</span>
              </>
            )}
            .
          </p>
          <Link href="/shiny/galerie" className={secondaryButton}>
            Voir dans la galerie
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {hunt.status === "ACTIVE" && (
          <form action={pauseHuntAction.bind(null, hunt.id)}>
            <button type="submit" className={`${secondaryButton} ${smallButton}`}>
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
            className={`${dangerButton} ${smallButton}`}
          >
            Supprimer la chasse
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
