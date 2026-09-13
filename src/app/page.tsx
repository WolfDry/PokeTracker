import Link from "next/link";

const features = [
  {
    href: "/jeux",
    title: "Pokédex par jeu",
    text: "Tous les Pokédex, de Rouge/Bleu à Écarlate/Violet, avec les Pokémon disponibles dans chaque jeu.",
  },
  {
    href: "/rencontres",
    title: "Où trouver un Pokémon",
    text: "Choisis un jeu et un lieu : zone, méthode, niveaux et taux de rencontre.",
  },
  {
    href: "/captures",
    title: "Suivi des captures",
    text: "Coche tes captures jeu par jeu et suis ta progression vers le Pokédex complet.",
  },
  {
    href: "/shiny",
    title: "Chasse aux shiny",
    text: "Compteur de rencontres par chasse et collection de tes shiny attrapés.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Ton compagnon d&apos;aventure Pokémon
        </h1>
        <p className="max-w-2xl text-muted">
          Pokédex, lieux de rencontre, captures et chasses shiny, pour tous les jeux de la
          série principale.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-accent"
          >
            <h2 className="font-medium">{feature.title}</h2>
            <p className="mt-1 text-sm text-muted">{feature.text}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
