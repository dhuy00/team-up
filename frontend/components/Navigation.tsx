"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Play,
  Plus,
  LogIn,
  ChevronDown,
  Settings,
  LogOut,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { NotificationBell } from "@/components/ui/NotificationBell";
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
  const { user, logout, setIsOnboardingOpen } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const currentNav = activeTab ?? getRouteIdFromPathname(pathname);

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAccountMenuOpen) {
        setIsAccountMenuOpen(false);
      }
    };

    if (isAccountMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-canvas border-b border-border transition-colors duration-200">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link
          href="/"
          onClick={(e) => {
            if (onTabChange) {
              e.preventDefault();
              onTabChange(NAV_TAB_IDS.EXPLORE);
            }
          }}
          className="flex items-center space-x-3 cursor-pointer select-none shrink-0"
        >
          <div className="w-10 h-10 rounded-[12px] bg-ink flex items-center justify-center text-primary shadow-sm shrink-0">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col gap-0.5 whitespace-nowrap">
            <span className="text-xl font-[900] tracking-tight text-ink leading-tight">
              {t("common.appName")}
            </span>
            <span className="text-[11px] font-bold text-mute tracking-wider uppercase leading-tight">
              {t("common.appTagline")}
            </span>
          </div>
        </Link>

        {/* Center Nav Pills rendered from unified APP_ROUTES */}
        <nav className="hidden md:flex items-center space-x-1 bg-canvas-soft p-1.5 rounded-[24px] border border-border shrink-0">
          {APP_ROUTES.filter(
            (route) => Boolean(user) || route.id !== NAV_TAB_IDS.PASSPORT
          ).map((route) => {
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
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-[24px] transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-canvas text-ink shadow-sm"
                    : "text-body hover:text-ink"
                }`}
              >
                {route.icon({ className: "w-4 h-4 shrink-0" })}
                <span>{t(route.nameKey)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Header Controls: Host Game CTA, Theme & Language toggles, User Account Pill */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Primary CTA Button */}
          <button
            type="button"
            onClick={() => onHostGameClick?.()}
            className="btn-primary px-4 py-2 text-sm font-semibold rounded-[24px] flex items-center space-x-1.5 shadow-sm shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span className="hidden lg:inline">{t("nav.hostGame")}</span>
          </button>

          {/* Language Selector */}
          <LanguageSelector />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* In-App Notification Center (Authenticated Only) */}
          {user && <NotificationBell />}

          {/* User Account / Auth Trigger -> Small Popup with Settings & Sign Out */}
          {user ? (
            <div ref={accountMenuRef} className="relative inline-flex items-center">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
                className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-canvas-soft hover:bg-border/50 border border-border transition cursor-pointer select-none"
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
                <ChevronDown
                  className={`w-3.5 h-3.5 text-mute hidden sm:block transition-transform duration-200 ${
                    isAccountMenuOpen ? "rotate-180 text-ink" : ""
                  }`}
                />
              </button>

              {isAccountMenuOpen && (
                <div
                  role="menu"
                  className="dropdown-popover absolute right-0 top-full mt-1.5 w-44 bg-canvas border border-border rounded-[14px] shadow-lg p-1.5 z-50 select-none"
                >
                  <div className="px-3 py-1.5 mb-1 border-b border-border/60">
                    <div className="text-xs font-bold text-ink truncate">
                      {user.profile.name}
                    </div>
                    <div className="text-[10px] font-mono text-mute truncate">
                      @{user.profile.username.replace(/^@/, "")}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      setIsOnboardingOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-semibold text-ink hover:bg-canvas-soft transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-mute shrink-0" />
                    <span>{t("auth.settings")}</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      logout();
                      router.push("/signin");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-semibold text-negative hover:bg-negative/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>{t("auth.signOut")}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/signin"
              className="px-4 py-2 rounded-full bg-canvas-soft hover:bg-border/60 border border-border text-xs font-bold text-ink inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t("auth.signIn")}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navigation;
