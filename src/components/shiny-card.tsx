import Link from "next/link";
import { ConfirmButton } from "@/components/confirm-button";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { dangerButton } from "@/components/ui";
import type { Shiny } from "@/lib/data/shiny";
import { deleteShinyAction } from "@/lib/shiny-actions";

const numberFr = new Intl.NumberFormat("fr-FR");
const dateFr = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

/** Vignette d'un shiny : compacte (aperçu de la page Shiny) ou détaillée avec suppression (galerie). */
export function ShinyCard({ shiny, compact = false }: { shiny: Shiny; compact?: boolean }) {
  if (compact) {
    return (
      <li className="flex flex-col items-center rounded-lg border border-border bg-card p-2 text-center">
        <Link href={`/pokemon/${shiny.species.id}`} className="hover:text-accent">
          <PokemonSprite pokemonId={shiny.species.pokemonId} alt="" size={72} shiny />
          <span className="block truncate text-sm font-medium">{shiny.species.nameFr}</span>
        </Link>
        <span className="text-xs text-muted">{shiny.version.nameFr}</span>
      </li>
    );
  }

  return (
    <li className="flex gap-3 rounded-lg border border-border bg-card p-3">
      <PokemonSprite pokemonId={shiny.species.pokemonId} alt="" size={80} shiny className="shrink-0" />
      <div className="min-w-0 flex-1 space-y-1 text-sm">
        <p className="font-medium">
          <Link href={`/pokemon/${shiny.species.id}`} className="hover:text-accent">
            {shiny.species.nameFr}
          </Link>
          {shiny.nickname && <span className="ml-2 font-normal text-muted">« {shiny.nickname} »</span>}
        </p>
        <p className="text-muted">
          {dateFr.format(shiny.caughtAt)}
          {shiny.method && ` · ${shiny.method}`}
          {shiny.encounters !== null && ` · ${numberFr.format(shiny.encounters)} rencontre${shiny.encounters > 1 ? "s" : ""}`}
        </p>
        {shiny.note && <p className="whitespace-pre-line text-muted">{shiny.note}</p>}
        <div className="flex flex-wrap gap-x-3 pt-1 text-xs">
          {shiny.huntId && (
            <Link href={`/shiny/chasse/${shiny.huntId}`} className="text-muted underline hover:text-foreground">
              Voir la chasse
            </Link>
          )}
          <form action={deleteShinyAction.bind(null, shiny.id)} className="ml-auto">
            <ConfirmButton message={`Retirer ${shiny.species.nameFr} (${shiny.version.nameFr}) de la galerie ?`} className={`${dangerButton} px-0 py-0`}>
              Supprimer
            </ConfirmButton>
          </form>
        </div>
      </div>
    </li>
  );
}
