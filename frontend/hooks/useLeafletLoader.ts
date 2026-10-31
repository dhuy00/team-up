"use client";

import { useEffect, useSyncExternalStore } from "react";
import { LEAFLET_CDN } from "@/constants/radar";
import "@/types/leaflet";

const leafletListeners = new Set<() => void>();

function subscribeLeaflet(callback: () => void) {
  leafletListeners.add(callback);
  return () => {
    leafletListeners.delete(callback);
  };
}

function getLeafletSnapshot(): boolean {
  return typeof window !== "undefined" && Boolean(window.L);
}

function getServerLeafletSnapshot(): boolean {
  return false;
}

function notifyLeafletReady() {
  leafletListeners.forEach((listener) => listener());
}

/**
 * Dynamically injects Leaflet CSS and JS from CDN on the client and
 * returns `true` once `window.L` is ready.
 */
export function useLeafletLoader(): boolean {
  const isReady = useSyncExternalStore(
    subscribeLeaflet,
    getLeafletSnapshot,
    getServerLeafletSnapshot
  );

  useEffect(() => {
    if (typeof window === "undefined" || window.L) {
      return;
    }

    const existingCss = document.getElementById(LEAFLET_CDN.CSS_ID);
    if (!existingCss) {
      const link = document.createElement("link");
      link.id = LEAFLET_CDN.CSS_ID;
      link.rel = "stylesheet";
      link.href = LEAFLET_CDN.CSS_URL;
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById(
      LEAFLET_CDN.JS_ID
    ) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", notifyLeafletReady);
      return () => {
        existingScript.removeEventListener("load", notifyLeafletReady);
      };
    }

    const script = document.createElement("script");
    script.id = LEAFLET_CDN.JS_ID;
    script.src = LEAFLET_CDN.JS_URL;
    script.async = true;
    script.onload = notifyLeafletReady;
    document.body.appendChild(script);
  }, []);

  return isReady;
}
