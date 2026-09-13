import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-border py-4 text-center text-xs text-muted">
          Données : PokeAPI · Pokémon est une marque de Nintendo / Creatures / Game Freak
        </footer>
      </body>
    </html>
  );
}
