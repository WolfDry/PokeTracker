import { permanentRedirect } from "next/navigation";
import { getPokedexHrefs } from "@/lib/data/pokedex-pages";

/** Anciennes adresses /jeux, /jeux/[version] et /jeux/[version]/[dex] → pages Pokédex. */
export async function GET(_request: Request, { params }: RouteContext<"/jeux/[[...path]]">) {
  const { path = [] } = await params;
  const [version, dex] = path;
  if (!version) permanentRedirect("/pokedex");

  const href = (await getPokedexHrefs())[version];
  if (!href) permanentRedirect("/pokedex");
  permanentRedirect(dex ? `${href}${href.includes("?") ? "&" : "?"}dex=${dex}` : href);
}
