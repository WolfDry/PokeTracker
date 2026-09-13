import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocationBySlug } from "@/lib/data/locations";

export async function generateMetadata({ params }: PageProps<"/lieux/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const location = await getLocationBySlug(slug);
  return { title: location ? location.nameFr : "Lieu introuvable" };
}

export default async function LocationPage({ params }: PageProps<"/lieux/[slug]">) {
  const { slug } = await params;
  const location = await getLocationBySlug(slug);
  if (!location) notFound();

  // Sous-zones nommées différemment du lieu (1F, B1F, rive nord…).
  const namedAreas = location.areas.filter((area) => area.nameFr && area.nameFr !== location.nameFr);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="text-sm text-muted">{location.region?.nameFr ?? "Lieu"}</div>
        <h1 className="text-2xl font-semibold">{location.nameFr}</h1>
        {location.nameEn !== location.nameFr && <p className="text-muted">{location.nameEn}</p>}
        {namedAreas.length > 0 && (
          <p className="text-sm text-muted">Zones : {namedAreas.map((area) => area.nameFr).join(" · ")}</p>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Pokémon à rencontrer, par jeu</h2>
        {location.versions.length === 0 ? (
          <p className="text-sm text-muted">Aucune donnée de rencontre pour ce lieu.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {location.versions.map((version) => (
              <li key={version.id}>
                <Link
                  href={`/rencontres/${version.slug}/${location.slug}`}
                  className="flex items-baseline justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:border-accent"
                >
                  <span className="font-medium">{version.nameFr}</span>
                  <span className="text-xs text-muted">
                    {version.speciesCount} Pokémon
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
