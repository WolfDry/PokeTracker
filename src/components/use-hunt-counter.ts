"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_HUNT_COUNT } from "@/lib/shiny";
import { setHuntCountAction } from "@/lib/shiny-actions";

export type SaveStatus = "saved" | "pending" | "saving" | "error";

const SAVE_DELAY = 600;

/**
 * Compteur d'une chasse côté client. Le nombre affiché change tout de suite ; la valeur est
 * envoyée au serveur après un court délai (un clic rapide = une seule requête), une requête
 * à la fois, et via un beacon si l'onglet passe en arrière-plan avant l'envoi.
 * En cas d'échec on garde le compte local (c'est lui qui a raison) et on propose de réessayer.
 */
export function useHuntCounter(huntId: string, initialCount: number) {
  const [count, setCount] = useState(initialCount);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [error, setError] = useState<string | null>(null);

  const latest = useRef(initialCount);
  const saved = useRef(initialCount);
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const save = useCallback(async () => {
    clearTimeout(timer.current);
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      // Le compte peut encore bouger pendant l'envoi : on boucle jusqu'à ce que la dernière valeur soit sauvée.
      while (latest.current !== saved.current) {
        setStatus("saving");
        const value = latest.current;
        const result = await setHuntCountAction(huntId, value);
        if (!result.ok) {
          setStatus("error");
          setError(result.error);
          return;
        }
        saved.current = value;
        setError(null);
      }
      setStatus("saved");
    } finally {
      inFlight.current = false;
    }
  }, [huntId]);

  const set = useCallback(
    (value: number) => {
      const next = Math.min(MAX_HUNT_COUNT, Math.max(0, Math.trunc(value)));
      if (Number.isNaN(next)) return;
      latest.current = next;
      setCount(next);
      if (next === saved.current) {
        clearTimeout(timer.current);
        if (!inFlight.current) setStatus("saved");
        return;
      }
      setStatus("pending");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(), SAVE_DELAY);
    },
    [save],
  );

  const add = useCallback((delta: number) => set(latest.current + delta), [set]);

  // Onglet masqué ou fermé avant l'envoi : beacon (survit à la fermeture, sans réponse).
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState !== "hidden" || latest.current === saved.current) return;
      const body = new URLSearchParams({ huntId, count: String(latest.current) });
      if (navigator.sendBeacon("/api/shiny/count", body)) {
        clearTimeout(timer.current);
        saved.current = latest.current;
        setStatus("saved");
      }
    };
    document.addEventListener("visibilitychange", flush);
    return () => document.removeEventListener("visibilitychange", flush);
  }, [huntId]);

  return { count, add, set, status, error, retry: save };
}
