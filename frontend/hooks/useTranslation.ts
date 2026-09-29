"use client";

import { useLanguage } from "@/context/LanguageContext";

export function useTranslation() {
  const { t, locale, setLocale, supportedLocales } = useLanguage();
  return { t, locale, setLocale, supportedLocales };
}

export default useTranslation;
