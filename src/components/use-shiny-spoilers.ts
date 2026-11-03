"use client";

import { useSyncExternalStore } from "react";

// Mode spoiler du shiny dex : tant que les shinies manquants ne sont pas révélés, ils s'affichent avec
// leur sprite normal. Choix mémorisé dans le navigateur, valable pour tous les jeux.

const KEY = "poketracker:shiny-spoilers";
const EVENT = "poketracker:shiny-spoilers";

/** Repli en mémoire si le stockage est bloqué (navigation privée) : le choix vaut alors pour la page. */
let fallback = false;

function read() {
  try {
    return localStorage.getItem(KEY) === "shown";
  } catch {
    return fallback;
  }
}

// Autres onglets via `storage`, onglet courant via un évènement maison.
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/**
 * `revealed` : sprites shiny des espèces manquantes visibles. Masqués côté serveur et au premier rendu :
 * le seul changement possible à l'hydratation est donc normal → shiny, jamais l'inverse.
 */
export function useShinySpoilers() {
  const revealed = useSyncExternalStore(subscribe, read, () => false);
  const toggle = () => {
    const next = !read();
    try {
      localStorage.setItem(KEY, next ? "shown" : "hidden");
    } catch {
      fallback = next;
    }
    window.dispatchEvent(new Event(EVENT));
  };
  return { revealed, toggle };
}
