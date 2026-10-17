"use client";

import React from "react";
import { Play } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { APP_ROUTES, NAV_TAB_IDS } from "@/components/navigation/routes";

interface FooterProps {
  onTabChange?: (tabId: number) => void;
}

export const Footer: React.FC<FooterProps> = ({ onTabChange }) => {
  const { t } = useTranslation();

  return (
    <footer className="bg-ink text-canvas-soft py-10 mt-16 border-t border-border transition-colors duration-200">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Brand Identity */}
          <div
            onClick={() => onTabChange?.(NAV_TAB_IDS.EXPLORE)}
            className="flex items-center space-x-3 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-[10px] bg-canvas text-ink flex items-center justify-center font-black text-sm">
              <Play className="w-4 h-4 fill-current text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base text-canvas tracking-tight leading-tight">
                {t("common.appName")}
              </span>
              <span className="text-[10px] font-bold text-mute tracking-wider uppercase leading-tight">
                {t("common.appTagline")}
              </span>
            </div>
          </div>

          {/* Dynamic Navigation Links using unified APP_ROUTES and i18n */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-mute font-medium">
            {APP_ROUTES.map((route) => (
              <button
                key={route.id}
                onClick={() => onTabChange?.(route.id)}
                className="hover:text-canvas transition-colors cursor-pointer"
              >
                {t(route.nameKey as any)}
              </button>
            ))}
          </div>
        </div>

        {/* Localized Copyright & Tagline */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-mute gap-3">
          <span>{t("footer.rights")} {t("footer.builtWith")}</span>
          <span className="font-medium text-canvas-soft/80">{t("footer.tagline")}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
