import { PokemonSprite } from "@/components/pokemon-sprite";
import { spriteBox } from "@/components/ui";
import { TEAM_SIZE } from "@/lib/team";

/** Les six emplacements d'une équipe sauvegardée (« 6.53.394-0-25 ») en petits sprites ; un emplacement vide reste en creux. */
export function TeamSprites({ slots }: { slots: string }) {
  const parts = slots ? slots.split("-") : [];
  const ids = Array.from({ length: TEAM_SIZE }, (_, i) => {
    const id = Number((parts[i] ?? "").split(".")[0]);
    return Number.isInteger(id) && id > 0 ? id : null;
  });
  return (
    <span className="grid grid-cols-6 gap-1.5">
      {ids.map((id, slot) =>
        id ? (
          <span key={slot} className={`${spriteBox} aspect-square w-full rounded-sm`}>
            <PokemonSprite pokemonId={id} alt="" size={56} className="size-full object-contain" />
          </span>
        ) : (
          <span key={slot} aria-hidden className="aspect-square w-full rounded-sm border border-dashed border-line" />
        ),
      )}
    </span>
  );
}
