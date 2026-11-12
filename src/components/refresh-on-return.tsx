"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const MIN_AWAY_MS = 30_000;

/**
 * Når appen har ligget i bakgrunnen en stund (f.eks. på hjemskjermen) og åpnes
 * igjen, hentes siden på nytt, så man ser det de andre har endret i mellomtiden.
 */
export function RefreshOnReturn() {
  const router = useRouter();

  useEffect(() => {
    let hiddenAt = 0;
    const onChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else if (hiddenAt && Date.now() - hiddenAt > MIN_AWAY_MS) {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, [router]);

  return null;
}
