"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";
import { THEME_KEY } from "@/lib/theme";

type Theme = "light" | "dark";

/** Thème effectif : choix mémorisé sur <html>, sinon préférence système. */
function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Le thème vit hors de React (attribut sur <html>) : on s'y abonne comme à une source externe.
function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => {
    media.removeEventListener("change", onChange);
    observer.disconnect();
  };
}

/**
 * Bascule clair / sombre. Le choix est posé sur <html data-theme> et mémorisé ;
 * le script d'amorçage du layout le réapplique avant le premier rendu.
 */
export function ThemeToggle({ className }: { className?: string }) {
  // `null` côté serveur et au premier rendu client : on ne connaît pas encore le thème.
  const theme = useSyncExternalStore(subscribe, currentTheme, () => null);

  const toggle = () => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Stockage indisponible (navigation privée) : le choix vaut pour la page.
    }
  };

  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Passer au thème clair" : "Passer au thème sombre"}
      title={dark ? "Thème clair" : "Thème sombre"}
      className={className}
    >
      {theme === null ? <span className="block size-[18px]" /> : dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
