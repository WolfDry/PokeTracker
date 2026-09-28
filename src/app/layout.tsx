import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SiteHeader } from "@/components/site-header";
import { themeBootScript } from "@/lib/theme";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "PokeTracker",
    template: "%s · PokeTracker",
  },
  description:
    "Compagnon d'aventure Pokémon : Pokédex par jeu, lieux de rencontre, suivi des captures et des chasses shiny.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `data-theme` est posé par le script d'amorçage avant l'hydratation : React ne doit pas s'en alarmer.
    <html lang="fr" className={`${manrope.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {/* Sur mobile, la barre d'onglets occupe le bas : on lui réserve la place. */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-8 pb-28 sm:px-10 sm:pt-12 md:pb-16">{children}</main>
        <footer className="hidden border-t border-line py-4 text-center t-small text-ink-3 md:block">
          Données : PokeAPI · Pokémon est une marque de Nintendo / Creatures / Game Freak
        </footer>
        <MobileTabBar />
      </body>
    </html>
  );
}
