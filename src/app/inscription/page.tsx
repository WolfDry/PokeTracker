import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignUpForm } from "@/components/auth-forms";
import { AuthFormSkeleton, AuthPage } from "@/components/auth-page";
import { getCurrentUser, safeNext } from "@/lib/session";

export const metadata: Metadata = { title: "Créer un compte" };

export default function Page({ searchParams }: PageProps<"/inscription">) {
  return (
    <AuthPage title="Créer un compte" intro="Un pseudo, un e-mail, un mot de passe : c'est tout ce qu'il faut pour commencer à cocher tes captures.">
      <Suspense fallback={<AuthFormSkeleton fields={4} />}>
        <SignUp searchParams={searchParams} />
      </Suspense>
    </AuthPage>
  );
}

async function SignUp({ searchParams }: Pick<PageProps<"/inscription">, "searchParams">) {
  const { next } = await searchParams;
  const target = safeNext(next, "");
  if (await getCurrentUser()) redirect(target || "/compte");
  return <SignUpForm next={target || undefined} />;
}
