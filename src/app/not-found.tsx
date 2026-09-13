import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3 py-16 text-center">
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <p className="text-muted">Ce Pokémon, ce jeu ou ce lieu n&apos;existe pas (ou pas encore).</p>
      <Link href="/" className="inline-block underline hover:text-accent">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
