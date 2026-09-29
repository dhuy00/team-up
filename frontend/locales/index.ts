import { en } from "./en";
import { vi } from "./vi";
import type { Locale, TranslationDictionary } from "@/types/i18n";

export const defaultLocale: Locale = "en";

export interface LocaleOption {
  code: Locale;
  label: string;
  flag: string;
}

export const supportedLocales: LocaleOption[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
];

export const dictionaries: Record<Locale, TranslationDictionary> = {
  en,
  vi,
};

export { en, vi };
