import Link from "next/link";
import { ConfirmButton } from "@/components/confirm-button";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { card, cardLink, dangerButton, smallButton, spriteBox, textLink } from "@/components/ui";
import type { Shiny } from "@/lib/data/shiny";
import { deleteShinyAction } from "@/lib/shiny-actions";

const numberFr = new Intl.NumberFormat("fr-FR");
const dateFr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

/** Vignette d'un shiny : compacte (aperçu de la page Shiny) ou détaillée avec suppression (galerie). */
export function ShinyCard({ shiny, compact = false }: { shiny: Shiny; compact?: boolean }) {
  if (compact) {
    return (
      <li>
        <Link href={`/pokemon/${shiny.species.id}`} className={`${cardLink} flex flex-col items-center gap-2 p-3 text-center`}>
          <span className={`${spriteBox} aspect-square w-full`}>
            <PokemonSprite pokemonId={shiny.species.pokemonId} alt="" size={64} shiny />
          </span>
          <span className="min-w-0">
            <span className="block truncate t-small font-semibold">{shiny.species.nameFr}</span>
            <span className="block truncate text-xs text-ink-2">{shiny.version.nameFr}</span>
          </span>
        </Link>
      </li>
    );
  }

  return (
    <li className={`${card} flex gap-4 p-4`}>
      <span className={`${spriteBox} size-20`}>
        <PokemonSprite pokemonId={shiny.species.pokemonId} alt="" size={72} shiny />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-semibold">
          <Link href={`/pokemon/${shiny.species.id}`} className="hover:underline">
            {shiny.species.nameFr}
          </Link>
          {shiny.nickname && <span className="ml-2 font-normal text-ink-2">« {shiny.nickname} »</span>}
        </p>
        <p className="t-small text-ink-2">
          {dateFr.format(shiny.caughtAt)}
          {shiny.method && ` · ${shiny.method}`}
          {shiny.encounters !== null && ` · ${numberFr.format(shiny.encounters)} rencontre${shiny.encounters > 1 ? "s" : ""}`}
        </p>
        {shiny.note && <p className="t-small whitespace-pre-line text-ink-2">{shiny.note}</p>}
        <div className="flex flex-wrap items-center gap-x-3 pt-1 t-small">
          {shiny.huntId && (
            <Link href={`/shiny/chasse/${shiny.huntId}`} className={`${textLink} text-ink-2`}>
              Voir la chasse
            </Link>
          )}
          <form action={deleteShinyAction.bind(null, shiny.id)} className="ml-auto">
            <ConfirmButton message={`Retirer ${shiny.species.nameFr} (${shiny.version.nameFr}) de la galerie ?`} className={`${dangerButton} ${smallButton} border-0 px-2`}>
              Supprimer
            </ConfirmButton>
          </form>
        </div>
      </div>
    </li>
  );
}
