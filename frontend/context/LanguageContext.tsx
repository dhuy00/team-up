"use client";

import React, { createContext, useContext, useCallback, useSyncExternalStore } from "react";
import type { Locale } from "@/types/i18n";
import { defaultLocale, dictionaries, supportedLocales, type LocaleOption } from "@/locales";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  supportedLocales: LocaleOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "teamup_locale";
const localeListeners = new Set<() => void>();

function subscribeLocale(callback: () => void) {
  localeListeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    localeListeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getLocaleSnapshot(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && saved in dictionaries) {
      return saved;
    }
    const browserLang = navigator.language.slice(0, 2) as Locale;
    if (browserLang in dictionaries) {
      return browserLang;
    }
  } catch {
    // Ignore storage errors
  }
  return defaultLocale;
}

function getServerLocaleSnapshot(): Locale {
  return defaultLocale;
}

// Deep helper for nested object lookup
function getNestedValue(obj: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot
  );

  const setLocale = useCallback((newLocale: Locale) => {
    if (newLocale in dictionaries) {
      try {
        localStorage.setItem(STORAGE_KEY, newLocale);
        document.documentElement.lang = newLocale;
      } catch {
        // Ignore localStorage write error
      }
      localeListeners.forEach((listener) => listener());
    }
  }, []);

  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const currentDict = dictionaries[locale] || dictionaries[defaultLocale];
      let value = getNestedValue(currentDict, path);

      // Fallback to defaultLocale if missing in selected locale
      if (value === undefined && locale !== defaultLocale) {
        value = getNestedValue(dictionaries[defaultLocale], path);
      }

      if (value === undefined) {
        return path;
      }

      // Replace interpolation params: {paramName}
      if (params) {
        return Object.entries(params).reduce((acc, [key, val]) => {
          return acc.replace(new RegExp(`\\{${key}\\}`, "g"), String(val));
        }, value);
      }

      return value;
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, supportedLocales }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
