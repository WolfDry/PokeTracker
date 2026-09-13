import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EncounterTable } from "@/components/encounter-table";
import { getLocationEncounters } from "@/lib/data/encounters";

export async function generateMetadata({ params }: PageProps<"/rencontres/[version]/[location]">): Promise<Metadata> {
  const { version, location } = await params;
  const data = await getLocationEncounters(version, location);
  return { title: data ? `${data.location.nameFr} — ${data.version.nameFr}` : "Lieu introuvable" };
}

export default async function LocationEncountersPage({ params }: PageProps<"/rencontres/[version]/[location]">) {
  const { version: versionSlug, location: locationSlug } = await params;
  const data = await getLocationEncounters(versionSlug, locationSlug);
  if (!data) notFound();
  const { version, location, table } = data;
  const twins = table.versions.slice(1);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/rencontres" className="hover:text-foreground">
          Rencontres
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/rencontres/${version.slug}`} className="hover:text-foreground">
          {version.nameFr}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{location.nameFr}</span>
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">
          {location.nameFr} <span className="text-lg font-normal text-muted">— {version.nameFr}</span>
        </h1>
        <p className="text-sm text-muted">
          {location.region && <>{location.region} · </>}
          <Link href={`/lieux/${location.slug}`} className="underline hover:text-foreground">
            Ce lieu dans les autres jeux
          </Link>
          {twins.length > 0 && (
            <>
              {" · "}Voir côté{" "}
              {twins.map((twin, index) => (
                <span key={twin.id}>
                  {index > 0 && ", "}
                  <Link href={`/rencontres/${twin.slug}/${location.slug}`} className="underline hover:text-foreground">
                    {twin.nameFr}
                  </Link>
                </span>
              ))}
            </>
          )}
        </p>
        {version.coverage?.status === "PARTIAL" && (
          <p className="rounded-md border border-border bg-card px-3 py-2 text-sm text-muted">{version.coverage.note}</p>
        )}
      </header>

      {table.areas.length === 0 ? (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-muted">
          {version.coverage?.status === "NONE"
            ? version.coverage.note
            : `Aucune rencontre connue à cet endroit dans ${version.nameFr}.`}
        </p>
      ) : (
        <EncounterTable table={table} currentVersionName={version.nameFr} />
      )}
    </div>
  );
}
