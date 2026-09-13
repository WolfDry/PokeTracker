import type { Metadata } from "next";

export const metadata: Metadata = { title: "Connexion" };

export default function Page() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Connexion</h1>
      <p className="text-muted">Bientôt : inscription et connexion (phase 5).</p>
    </div>
  );
}
