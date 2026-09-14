import Link from "next/link";
import { secondaryButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-6 py-16 text-center">
      <p className="t-caption">Erreur 404</p>
      <h1 className="t-display">Page introuvable</h1>
      <p className="text-ink-2">Ce Pokémon, ce jeu ou ce lieu n&apos;existe pas (ou pas encore).</p>
      <Link href="/" className={secondaryButton}>
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
