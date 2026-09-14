import type { PokedexPage } from "@/lib/data/pokedex-pages";

/** « Pokédex de Kanto », « Pokédex d'Alola », « Pokédex national » — utilisable côté client comme côté serveur. */
export function pokedexPageTitle(page: Pick<PokedexPage, "slug" | "title">) {
  if (page.slug === "national") return "Pokédex national";
  return /^[aeiouyâàéèêîïôûù]/i.test(page.title) ? `Pokédex d'${page.title}` : `Pokédex de ${page.title}`;
}
