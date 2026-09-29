"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Compass, Shield, MessageSquare, User, Plus, Play } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

const Navigation = () => {
  const { t } = useTranslation();
  const [activeNav, setActiveNav] = useState(1);

  const navItems = [
    {
      id: 1,
      name: t("nav.exploreGames"),
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 2,
      name: t("nav.clubsAndSquads"),
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: 3,
      name: t("nav.chats"),
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: 4,
      name: t("nav.sportsPassport"),
      icon: <User className="w-4 h-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-canvas border-b border-border transition-colors duration-200">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3 cursor-pointer select-none">
          <div className="w-10 h-10 rounded-[12px] bg-ink flex items-center justify-center text-primary shadow-sm">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-[900] tracking-tight text-ink leading-tight">
              {t("common.appName")}
            </span>
            <span className="text-[11px] font-bold text-mute tracking-wider uppercase leading-tight">
              {t("common.appTagline")}
            </span>
          </div>
        </div>

        {/* Center Nav Pills */}
        <nav className="hidden md:flex items-center space-x-1 bg-canvas-soft p-1.5 rounded-[24px] border border-border">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold rounded-[24px] transition-all cursor-pointer ${
                  isActive
                    ? "bg-canvas text-ink shadow-sm"
                    : "text-body hover:text-ink"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Header Controls: Emergency Sub, Host Game CTA, Theme & Language toggles, User Avatar */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Emergency Alert Pill */}
          <button className="hidden lg:flex items-center space-x-2 px-3.5 py-2 bg-negative-bg text-white hover:bg-negative rounded-full text-xs font-semibold transition cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            <span>{t("nav.subNeededCount", { count: 1 })}</span>
          </button>

          {/* Primary CTA Button */}
          <button className="px-5 py-2.5 bg-primary hover:bg-primary-active text-ink text-sm font-semibold rounded-[24px] transition flex items-center space-x-1.5 cursor-pointer shadow-sm">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">{t("nav.hostGame")}</span>
          </button>

          {/* Language Selector */}
          <LanguageSelector />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Quick Profile Avatar */}
          <div className="flex items-center pl-1 cursor-pointer">
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
