"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Play, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { APP_ROUTES, NAV_TAB_IDS } from "@/components/navigation/routes";

interface NavigationProps {
  activeTab?: number;
  onTabChange?: (tabId: number) => void;
  onHostGameClick?: () => void;
}

const Navigation = ({ activeTab, onTabChange, onHostGameClick }: NavigationProps = {}) => {
  const { t } = useTranslation();
  const [internalActiveNav, setInternalActiveNav] = useState<number>(NAV_TAB_IDS.EXPLORE);
  const currentNav = activeTab ?? internalActiveNav;

  const handleNavClick = (id: number) => {
    if (onTabChange) {
      onTabChange(id);
    } else {
      setInternalActiveNav(id);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-canvas border-b border-border transition-colors duration-200">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => handleNavClick(NAV_TAB_IDS.EXPLORE)}
          className="flex items-center space-x-3 cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-[12px] bg-ink flex items-center justify-center text-primary shadow-sm">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xl font-[900] tracking-tight text-ink leading-tight">
              {t("common.appName")}
            </span>
            <span className="text-[11px] font-bold text-mute tracking-wider uppercase leading-tight">
              {t("common.appTagline")}
            </span>
          </div>
        </div>

        {/* Center Nav Pills rendered from unified APP_ROUTES */}
        <nav className="hidden md:flex items-center space-x-1 bg-canvas-soft p-1.5 rounded-[24px] border border-border">
          {APP_ROUTES.map((route) => {
            const isActive = currentNav === route.id;
            return (
              <button
                key={route.id}
                onClick={() => handleNavClick(route.id)}
                className={`flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold rounded-[24px] transition-all cursor-pointer ${
                  isActive
                    ? "bg-canvas text-ink shadow-sm"
                    : "text-body hover:text-ink"
                }`}
              >
                {route.icon({ className: "w-4 h-4" })}
                <span>{t(route.nameKey)}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Header Controls: Emergency Sub, Host Game CTA, Theme & Language toggles, User Avatar */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Emergency Alert Pill */}
          {/* <button className="hidden lg:flex items-center space-x-2 px-3.5 py-2 bg-negative-bg text-white hover:bg-negative rounded-full text-xs font-semibold transition cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            <span>{t("nav.subNeededCount", { count: 1 })}</span>
          </button> */}

          {/* Primary CTA Button */}
          <button 
            onClick={() => onHostGameClick?.()}
            className="btn-primary px-5 py-2.5 text-sm font-semibold rounded-[24px] flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">{t("nav.hostGame")}</span>
          </button>

          {/* Language Selector */}
          <LanguageSelector />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Quick Profile Avatar */}
          <div 
            onClick={() => handleNavClick(NAV_TAB_IDS.PASSPORT)}
            className="flex items-center pl-1 cursor-pointer"
            title="View Sports Passport"
          >
            <div className="relative w-9 h-9">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                alt="User Avatar"
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover border-2 border-ink"
                unoptimized
              />
              <span className="absolute -bottom-1 -right-1 bg-primary text-ink text-[9px] font-black px-1 rounded-full border border-ink">
                98%
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
