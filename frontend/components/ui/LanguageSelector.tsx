"use client";

import * as React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  const { locale, setLocale, supportedLocales } = useLanguage();

  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="language-select" className="sr-only">
        Select Language
      </label>
      <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-canvas border border-border text-xs font-semibold text-ink">
        <Globe className="w-3.5 h-3.5 text-mute" />
        <select
          id="language-select"
          value={locale}
          onChange={(e) => setLocale(e.target.value as typeof locale)}
          className="bg-transparent text-ink text-xs font-semibold focus:outline-none cursor-pointer pr-1"
        >
          {supportedLocales.map((item) => (
            <option key={item.code} value={item.code} className="bg-canvas text-ink">
              {item.flag} {item.code.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default LanguageSelector;
