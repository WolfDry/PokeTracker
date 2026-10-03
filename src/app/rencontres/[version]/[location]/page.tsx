import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { EncounterTable } from "@/components/encounter-table";
import { MapIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { notice, secondaryButton, textLink } from "@/components/ui";
import { getCapturedSpeciesIds } from "@/lib/data/captures";
import { getLocationEncounters } from "@/lib/data/encounters";
import { DLC_BASE_VERSION, isHiddenVersion } from "@/lib/data/filters";
import { getVersionBySlug } from "@/lib/data/games";
import type { LocationEncounterTable } from "@/lib/encounters";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/rencontres/[version]/[location]">): Promise<Metadata> {
  const { version, location } = await params;
  const data = await getLocationEncounters(version, location);
  return { title: data ? `${data.location.nameFr} — ${data.version.nameFr}` : "Lieu introuvable" };
}

type CapturesProps = {
  table: LocationEncounterTable;
  currentVersionName: string;
  captureVersion: { id: number; nameFr: string };
  loginNext: string;
};

/** Le tableau avec les cases « attrapé » de l'utilisateur : dépend de la session, il est streamé. */
async function EncounterTableWithCaptures({ table, currentVersionName, captureVersion, loginNext }: CapturesProps) {
  const user = await getCurrentUser();
  const captured = user ? await getCapturedSpeciesIds(user.id, captureVersion.id) : null;
  return (
    <EncounterTable
      table={table}
      currentVersionName={currentVersionName}
      capture={{ versionId: captureVersion.id, versionName: captureVersion.nameFr, captured, loginNext }}
    />
  );
}

export default async function LocationEncountersPage({ params }: PageProps<"/rencontres/[version]/[location]">) {
  const { version: versionSlug, location: locationSlug } = await params;
  const data = await getLocationEncounters(versionSlug, locationSlug);
  if (!data) notFound();
  const { version, location, table } = data;
  // Les captures d'une extension (Isolarmure, Couronneige…) se cochent dans le jeu de base.
  const captureVersion = DLC_BASE_VERSION[version.slug] ? await getVersionBySlug(DLC_BASE_VERSION[version.slug]) : version;
  const twins = table.versions.slice(1);
  const speciesCount = new Set(table.areas.flatMap((area) => area.rows.map((row) => table.pokemons[row.pokemonId].speciesId))).size;

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[{ href: "/rencontres", label: "Rencontres" }, { href: `/rencontres/${version.slug}`, label: version.nameFr }, { label: location.nameFr }]}
      />

      <PageHeader
        eyebrow={[location.region, twins.length > 0 ? [version, ...twins].map((v) => v.nameFr).join(" et ") : version.nameFr].filter(Boolean).join(" · ")}
        title={location.nameFr}
        intro={
          <p className="t-small">
            {table.areas.length > 0 && (
              <>
                {speciesCount} Pokémon · {table.areas.length} zone{table.areas.length > 1 ? "s" : ""}
              </>
            )}
            {twins.length > 0 && (
              <>
                {table.areas.length > 0 && " · "}Voir côté{" "}
                {twins.map((twin, index) => (
                  <span key={twin.id}>
                    {index > 0 && ", "}
                    <Link href={`/rencontres/${twin.slug}/${location.slug}`} className={textLink}>
                      {twin.nameFr}
                    </Link>
                  </span>
                ))}
              </>
            )}
          </p>
        }
        actions={
          <Link href={`/lieux/${location.slug}`} className={secondaryButton}>
            <MapIcon size={18} /> Ce lieu dans les autres jeux
          </Link>
        }
      />

      {version.coverage?.status === "PARTIAL" && <p className={`${notice} t-small`}>{version.coverage.note}</p>}

      {table.areas.length === 0 ? (
        <p className={notice}>
          {version.coverage?.status === "NONE" ? version.coverage.note : `Aucune rencontre connue à cet endroit dans ${version.nameFr}.`}
        </p>
      ) : captureVersion && !isHiddenVersion(captureVersion.slug) ? (
        // Le tableau seul (en cache) s'affiche tout de suite ; les cases « attrapé » arrivent avec la session.
        <Suspense fallback={<EncounterTable table={table} currentVersionName={version.nameFr} />}>
          <EncounterTableWithCaptures
            table={table}
            currentVersionName={version.nameFr}
            captureVersion={captureVersion}
            loginNext={`/rencontres/${version.slug}/${location.slug}`}
          />
        </Suspense>
      ) : (
        <EncounterTable table={table} currentVersionName={version.nameFr} />
      )}
    </div>
  );
}
