"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Globe, ChevronDown, Check } from "lucide-react";

export function LanguageSelector() {
  const { locale, setLocale, supportedLocales } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeLocale =
    supportedLocales.find((item) => item.code === locale) || supportedLocales[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-canvas border border-border text-xs font-semibold text-ink hover:border-ink/60 transition-colors cursor-pointer select-none"
      >
        <Globe className="w-3.5 h-3.5 text-mute" />
        <span>{activeLocale.flag}</span>
        <span>{activeLocale.code.toUpperCase()}</span>
        <ChevronDown
          className={`w-3 h-3 text-mute transition-transform duration-200 ${
            isOpen ? "rotate-180 text-ink" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="dropdown-popover absolute right-0 top-full mt-1.5 w-36 bg-canvas border border-border rounded-[14px] shadow-lg p-1 z-50 select-none"
        >
          {supportedLocales.map((item) => {
            const isSelected = item.code === locale;
            return (
              <button
                key={item.code}
                role="option"
                aria-selected={isSelected}
                type="button"
                onClick={() => {
                  setLocale(item.code as typeof locale);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-xs font-semibold cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary-pale text-positive-deep font-bold"
                    : "text-ink hover:bg-canvas-soft"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{item.flag}</span>
                  <span>{item.label}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-positive-deep stroke-[2.5]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
