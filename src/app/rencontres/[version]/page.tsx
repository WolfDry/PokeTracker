import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocationPicker } from "@/components/location-picker";
import { getVersionLocations } from "@/lib/data/encounters";
import { getVersionBySlug, getVersionSlugs } from "@/lib/data/games";

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
  const data = await getVersionLocations(slug);
  if (!data) notFound();
  const { version, groups, locationCount } = data;
  const coverage = version.coverage;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/rencontres" className="hover:text-foreground">
          Rencontres
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{version.nameFr}</span>
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Lieux de rencontre — {version.nameFr}</h1>
        <p className="text-sm text-muted">
          {version.generation.nameFr}
          {version.siblings.length > 0 && (
            <>
              {" · "}
              Version jumelle :{" "}
              {version.siblings.map((sibling, index) => (
                <span key={sibling.id}>
                  {index > 0 && ", "}
                  <Link href={`/rencontres/${sibling.slug}`} className="underline hover:text-foreground">
                    {sibling.nameFr}
                  </Link>
                </span>
              ))}
            </>
          )}
          {" · "}
          <Link href={`/jeux/${version.slug}`} className="underline hover:text-foreground">
            Pokédex du jeu
          </Link>
        </p>
        {coverage?.status === "PARTIAL" && (
          <p className="rounded-md border border-border bg-card px-3 py-2 text-sm text-muted">{coverage.note}</p>
        )}
      </header>

      {locationCount === 0 ? (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-muted">
          {coverage?.note ?? "Aucune donnée de rencontre pour ce jeu."}
        </p>
      ) : (
        <>
          <p className="text-sm text-muted">
            {locationCount} lieu{locationCount > 1 ? "x" : ""} avec des rencontres. Les cadeaux, échanges et rencontres fixes sont inclus.
          </p>
          <LocationPicker versionSlug={version.slug} groups={groups} />
        </>
      )}
    </div>
  );
}
