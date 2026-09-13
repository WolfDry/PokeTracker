import Link from "next/link";
import { signOutAction } from "@/lib/auth-actions";
import { getCurrentUser } from "@/lib/session";

const buttonClass = "rounded-md border border-border px-3 py-1.5 text-sm hover:bg-background";

/** Coin en-tête : « Connexion » ou pseudo + déconnexion. Lit la session → à rendre dans un <Suspense>. */
export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link href="/connexion" className={buttonClass}>
        Connexion
      </Link>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Link href="/compte" className="max-w-28 truncate text-sm font-medium hover:text-accent sm:max-w-40" title="Mon compte">
        {user.name}
      </Link>
      {/* Sur mobile, la déconnexion se fait depuis « Mon compte ». */}
      <form action={signOutAction} className="hidden sm:block">
        <button type="submit" className={buttonClass}>
          Déconnexion
        </button>
      </form>
    </div>
  );
}

/** Réservé pendant le chargement de la session : même encombrement que le bouton. */
export function UserMenuFallback() {
  return <span aria-hidden className="inline-block h-8 w-24 animate-pulse rounded-md border border-border bg-background" />;
}
