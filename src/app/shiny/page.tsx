import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shiny" };

export default function Page() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Shiny</h1>
      <p className="text-muted">Bientôt : compteur de chasse et shiny attrapés (phase 7).</p>
    </div>
  );
}
