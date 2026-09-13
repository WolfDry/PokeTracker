import Form from "next/form";

type Props = { defaultValue?: string; autoFocus?: boolean; size?: "sm" | "lg" };

/** Formulaire GET vers /recherche : fonctionne sans JavaScript, navigation client sinon. */
export function SearchForm({ defaultValue = "", autoFocus = false, size = "sm" }: Props) {
  const large = size === "lg";
  return (
    <Form action="/recherche" role="search" className={`flex gap-2 ${large ? "w-full" : ""}`}>
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Pokémon, jeu ou lieu…"
        aria-label="Rechercher un Pokémon, un jeu ou un lieu"
        autoComplete="off"
        autoFocus={autoFocus}
        className={`rounded-md border border-border bg-background focus:border-accent focus:outline-none ${
          large ? "w-full px-4 py-2.5 text-base" : "w-44 px-2.5 py-1 text-sm"
        }`}
      />
      {large && (
        <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
          Rechercher
        </button>
      )}
    </Form>
  );
}
