"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Play, Plus, LogIn, ChevronDown } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import {
  APP_ROUTES,
  NAV_TAB_IDS,
  getRouteIdFromPathname,
} from "@/components/navigation/routes";

interface NavigationProps {
  activeTab?: number;
  onTabChange?: (tabId: number) => void;
  onHostGameClick?: () => void;
}

const Navigation = ({
  activeTab,
  onTabChange,
  onHostGameClick,
}: NavigationProps = {}) => {
  const { t } = useTranslation();
  const { user, setIsAuthModalOpen } = useAuth();
  const pathname = usePathname();
  const currentNav = activeTab ?? getRouteIdFromPathname(pathname);

  return (
    <header className="sticky top-0 z-50 bg-canvas border-b border-border transition-colors duration-200">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          onClick={(e) => {
            if (onTabChange) {
              e.preventDefault();
              onTabChange(NAV_TAB_IDS.EXPLORE);
            }
          }}
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
        </Link>

        {/* Center Nav Pills rendered from unified APP_ROUTES */}
        <nav className="hidden md:flex items-center space-x-1 bg-canvas-soft p-1.5 rounded-[24px] border border-border">
          {APP_ROUTES.map((route) => {
            const isActive = currentNav === route.id;
            return (
              <Link
                key={route.id}
                href={route.href}
                onClick={(e) => {
                  if (onTabChange) {
                    e.preventDefault();
                    onTabChange(route.id);
                  }
                }}
                className={`flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold rounded-[24px] transition-all cursor-pointer ${
                  isActive
                    ? "bg-canvas text-ink shadow-sm"
                    : "text-body hover:text-ink"
                }`}
              >
                {route.icon({ className: "w-4 h-4" })}
                <span>{t(route.nameKey)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Header Controls: Host Game CTA, Theme & Language toggles, User Account Pill */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Primary CTA Button */}
          <button
            type="button"
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

          {/* User Account / Auth Trigger */}
          {user ? (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-canvas-soft hover:bg-border/50 border border-border transition cursor-pointer"
              title={t("auth.switchAccount")}
            >
              <div className="relative w-8 h-8">
                <Image
                  src={user.profile.avatar}
                  alt={user.profile.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover border border-ink"
                  unoptimized
                />
                <span className="absolute -bottom-1 -right-1 bg-primary text-ink text-[8px] font-black px-1 rounded-full border border-ink">
                  {user.profile.karma}%
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-mute hidden sm:block" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 rounded-full bg-canvas-soft hover:bg-border/60 border border-border text-xs font-bold text-ink inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t("auth.signIn")}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navigation;
