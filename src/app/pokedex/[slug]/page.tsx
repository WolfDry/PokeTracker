import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageSkeleton } from "@/components/page-skeleton";
import { PokedexExplorer } from "@/components/pokedex-explorer";
import { getCapturedSpeciesIds } from "@/lib/data/captures";
import { getPokedexBySlug } from "@/lib/data/pokedex";
import { getExtraEntries } from "@/lib/data/pokedex-extras";
import { getPokedexPage, getPokedexPageSlugs, type PokedexPage } from "@/lib/data/pokedex-pages";
import { pokedexPageTitle } from "@/lib/pokedex-title";
import { getCurrentUser } from "@/lib/session";

export async function generateStaticParams() {
  const slugs = await getPokedexPageSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/pokedex/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPokedexPage(slug);
  return { title: page ? pokedexPageTitle(page) : "Pokédex introuvable" };
}

export default async function PokedexPageRoute({ params, searchParams }: PageProps<"/pokedex/[slug]">) {
  const { slug } = await params;
  const page = await getPokedexPage(slug);
  if (!page) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ href: "/pokedex", label: "Pokédex" }, { label: page.slug === "national" ? "National" : page.title }]} />
      {/* Le jeu et le Pokédex viennent de l'URL (`?jeu=`, `?dex=`), les captures de la session : le tout est streamé. */}
      <Suspense fallback={<PageSkeleton />}>
        <Explorer page={page} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Explorer({ page, searchParams }: { page: PokedexPage; searchParams: PageProps<"/pokedex/[slug]">["searchParams"] }) {
  const { jeu, dex: dexParam } = await searchParams;
  // Sur le national, aucun jeu n'est présélectionné : on le parcourt sans cocher.
  const game = page.games.find((g) => g.slug === jeu) ?? (page.slug === "national" ? null : (page.games[0] ?? null));
  const dex = page.dexes.find((d) => d.slug === dexParam) ?? page.dexes[0];

  const [pokedex, user, extras] = await Promise.all([getPokedexBySlug(dex.slug), getCurrentUser(), game ? getExtraEntries(game.versionGroupSlug) : []]);
  if (!pokedex) notFound();
  const captured = user && game ? await getCapturedSpeciesIds(user.id, game.id) : null;

  const query = new URLSearchParams();
  if (game) query.set("jeu", game.slug);
  if (dex.slug !== page.dexes[0].slug) query.set("dex", dex.slug);
  const loginNext = `/pokedex/${page.slug}${query.size > 0 ? `?${query}` : ""}`;

  return (
    <PokedexExplorer
      key={`${game?.slug ?? ""}/${dex.slug}`}
      page={page}
      game={game}
      dex={{ slug: dex.slug, nameFr: dex.nameFr }}
      entries={pokedex.entries}
      extras={extras}
      captured={captured}
      loginNext={loginNext}
    />
  );
}
