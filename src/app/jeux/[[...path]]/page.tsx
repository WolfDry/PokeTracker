import { permanentRedirect } from "next/navigation";
import { getPokedexHrefs } from "@/lib/data/pokedex-pages";

/** Anciennes adresses /jeux, /jeux/[version] et /jeux/[version]/[dex] → pages Pokédex. */
export default async function LegacyGamesRedirect({ params }: PageProps<"/jeux/[[...path]]">) {
  const { path = [] } = await params;
  const [version, dex] = path;
  if (!version) permanentRedirect("/pokedex");

  const href = (await getPokedexHrefs())[version];
  if (!href) permanentRedirect("/pokedex");
  permanentRedirect(dex ? `${href}${href.includes("?") ? "&" : "?"}dex=${dex}` : href);
}
