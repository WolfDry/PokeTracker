import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { PokedexIcon } from "@/components/icons";
import { LocationPicker } from "@/components/location-picker";
import { PageHeader } from "@/components/page-header";
import { notice, secondaryButton, textLink } from "@/components/ui";
import { getVersionLocations } from "@/lib/data/encounters";
import { getVersionBySlug, getVersionSlugs } from "@/lib/data/games";
import { getPokedexHrefs } from "@/lib/data/pokedex-pages";

export async function generateStaticParams() {
  const slugs = await getVersionSlugs();
  return slugs.map((version) => ({ version }));
}

export async function generateMetadata({ params }: PageProps<"/rencontres/[version]">): Promise<Metadata> {
  const { version: slug } = await params;
  const version = await getVersionBySlug(slug);
  return { title: version ? `Rencontres ${version.nameFr}` : "Jeu introuvable" };
}

export default async function VersionEncountersPage({ params }: PageProps<"/rencontres/[version]">) {
  const { version: slug } = await params;
  const [data, pokedexHrefs] = await Promise.all([getVersionLocations(slug), getPokedexHrefs()]);
  if (!data) notFound();
  const { version, groups, locationCount } = data;
  const coverage = version.coverage;

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ href: "/rencontres", label: "Rencontres" }, { label: version.nameFr }]} />

      <PageHeader
        eyebrow={version.generation.nameFr}
        title={`Lieux de ${version.nameFr}`}
        intro={
          <p className="t-small">
            {locationCount > 0 && `${locationCount} lieu${locationCount > 1 ? "x" : ""} avec des rencontres`}
            {version.siblings.length > 0 && (
              <>
                {locationCount > 0 && " · "}Version jumelle :{" "}
                {version.siblings.map((sibling, index) => (
                  <span key={sibling.id}>
                    {index > 0 && ", "}
                    <Link href={`/rencontres/${sibling.slug}`} className={textLink}>
                      {sibling.nameFr}
                    </Link>
                  </span>
                ))}
              </>
            )}
          </p>
        }
        actions={
          <Link href={pokedexHrefs[version.slug] ?? "/pokedex"} className={secondaryButton}>
            <PokedexIcon size={18} /> Pokédex du jeu
          </Link>
        }
      />

      {coverage?.status === "PARTIAL" && <p className={`${notice} t-small`}>{coverage.note}</p>}

      {locationCount === 0 ? (
        <p className={notice}>{coverage?.note ?? "Aucune donnée de rencontre pour ce jeu."}</p>
      ) : (
        <>
          <p className="t-small text-ink-3">Les cadeaux, échanges et rencontres fixes sont inclus.</p>
          <LocationPicker versionSlug={version.slug} groups={groups} />
        </>
      )}
    </div>
  );
}
