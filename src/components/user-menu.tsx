import Link from "next/link";
import { UserIcon } from "@/components/icons";
import { ghostButton, secondaryButton, smallButton } from "@/components/ui";
import { signOutAction } from "@/lib/auth-actions";
import { getCurrentUser } from "@/lib/session";

/** Coin en-tête : « Connexion » ou avatar + pseudo + déconnexion. Lit la session → à rendre dans un <Suspense>. */
export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link href="/connexion" className={`${secondaryButton} ${smallButton}`}>
        Connexion
      </Link>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-1">
      <Link href="/compte" title="Mon compte" className={`${ghostButton} h-10 max-w-44 gap-2 px-1.5 text-ink sm:pr-2.5`}>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2">
          <UserIcon size={16} />
        </span>
        <span className="hidden truncate text-sm font-medium sm:block">{user.name}</span>
      </Link>
      {/* Sur mobile, la déconnexion se fait depuis « Mon compte ». */}
      <form action={signOutAction} className="hidden lg:block">
        <button type="submit" className={`${ghostButton} ${smallButton}`}>
          Déconnexion
        </button>
      </form>
    </div>
  );
}

/** Réservé pendant le chargement de la session : même encombrement que l'avatar. */
export function UserMenuFallback() {
  return <span aria-hidden className="mx-1.5 inline-block size-8 animate-pulse rounded-full bg-surface-2" />;
}
