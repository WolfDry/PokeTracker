import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, SectionHeader } from "@/components/page-header";
import { cardLink } from "@/components/ui";
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
    <div className="space-y-10">
      <PageHeader
        eyebrow={location.region?.nameFr ?? "Lieu"}
        title={location.nameFr}
        intro={
          <div className="space-y-1 t-small">
            {location.nameEn !== location.nameFr && <p>{location.nameEn}</p>}
            {namedAreas.length > 0 && <p>Zones : {namedAreas.map((area) => area.nameFr).join(" · ")}</p>}
          </div>
        }
      />

      <section className="space-y-4">
        <SectionHeader title="Pokémon à rencontrer, par jeu" />
        {location.versions.length === 0 ? (
          <p className="t-small text-ink-2">Aucune donnée de rencontre pour ce lieu.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {location.versions.map((version) => (
              <li key={version.id}>
                <Link href={`/rencontres/${version.slug}/${location.slug}`} className={`${cardLink} flex items-baseline justify-between gap-3 px-4 py-3.5`}>
                  <span className="font-semibold">{version.nameFr}</span>
                  <span className="t-small text-ink-2">{version.speciesCount} Pokémon</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
