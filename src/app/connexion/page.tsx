import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth-forms";
import { AuthFormSkeleton, AuthPage } from "@/components/auth-page";
import { getCurrentUser, safeNext } from "@/lib/session";

export const metadata: Metadata = { title: "Connexion" };

export default function Page({ searchParams }: PageProps<"/connexion">) {
  return (
    <AuthPage title="Connexion" intro="Retrouve tes captures et tes chasses shiny sur tous tes jeux.">
      <Suspense fallback={<AuthFormSkeleton fields={2} />}>
        <SignIn searchParams={searchParams} />
      </Suspense>
    </AuthPage>
  );
}

// Lit `?next=` et la session à la requête : un utilisateur déjà connecté n'a rien à faire ici.
async function SignIn({ searchParams }: Pick<PageProps<"/connexion">, "searchParams">) {
  const { next } = await searchParams;
  const target = safeNext(next, "");
  if (await getCurrentUser()) redirect(target || "/compte");
  return <SignInForm next={target || undefined} />;
}
