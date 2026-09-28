import Form from "next/form";
import { SearchIcon } from "@/components/icons";
import { input, largeButton, primaryButton } from "@/components/ui";

type Props = { defaultValue?: string; autoFocus?: boolean; size?: "sm" | "lg" };

/** Formulaire GET vers /recherche : fonctionne sans JavaScript, navigation client sinon. */
export function SearchForm({ defaultValue = "", autoFocus = false, size = "sm" }: Props) {
  const large = size === "lg";
  return (
    <Form action="/recherche" role="search" className={`flex gap-2 ${large ? "w-full" : "min-w-0"}`}>
      <div className={`relative ${large ? "flex-1" : "min-w-0"}`}>
        <SearchIcon size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="Pokémon, jeu ou lieu…"
          aria-label="Rechercher un Pokémon, un jeu ou un lieu"
          autoComplete="off"
          autoFocus={autoFocus}
          className={`${input} pl-9 ${large ? "h-12 text-base" : "h-9 w-60 max-w-full rounded-full border-line bg-surface-2 text-sm"}`}
        />
      </div>
      {large && (
        <button type="submit" className={`${primaryButton} ${largeButton}`}>
          Rechercher
        </button>
      )}
    </Form>
  );
}
