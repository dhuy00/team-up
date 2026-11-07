"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Clock,
  Megaphone,
  Sparkles,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { useTranslation } from "@/hooks/useTranslation";
import type { AppNotificationKind } from "@/types/models";

function getNotificationIcon(kind: AppNotificationKind) {
  switch (kind) {
    case "waitlist_promoted":
      return <Sparkles className="w-3.5 h-3.5 text-positive-deep" />;
    case "match_reminder":
      return <Clock className="w-3.5 h-3.5 text-ink" />;
    case "host_announcement":
      return <Megaphone className="w-3.5 h-3.5 text-warning-deep" />;
    case "squad_invite":
    case "lfg_ping":
      return <UserPlus className="w-3.5 h-3.5 text-positive-deep" />;
  }
}

export const NotificationBell: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    clearNotifications,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={t("notifications.title")}
        title={t("notifications.title")}
        className="relative p-2.5 rounded-full bg-canvas-soft hover:bg-border/60 border border-border text-ink transition cursor-pointer flex items-center justify-center"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-ink border border-ink text-[10px] font-black flex items-center justify-center leading-none shadow-2xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={t("notifications.title")}
          className="dropdown-popover absolute right-0 mt-2 w-80 sm:w-96 bg-canvas border border-border rounded-[20px] shadow-2xl z-50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2 bg-canvas-soft/40">
            <div className="flex items-center gap-2 min-w-0">
              <h4 className="font-[900] text-xs sm:text-sm text-ink truncate">
                {t("notifications.title")}
              </h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-primary-pale text-positive-deep border border-primary-neutral rounded-full text-[10px] font-bold shrink-0">
                  {t("notifications.unreadCountLabel", { count: unreadCount })}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="px-2 py-1 rounded-full text-[11px] font-bold text-ink hover:bg-canvas-soft flex items-center gap-1 transition cursor-pointer"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>{t("notifications.markAllRead")}</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearNotifications}
                  title={t("notifications.clearAll")}
                  aria-label={t("notifications.clearAll")}
                  className="p-1.5 rounded-full text-mute hover:text-negative hover:bg-negative/10 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-1">
                <div className="font-bold text-xs text-ink">
                  {t("notifications.emptyTitle")}
                </div>
                <p className="text-[11px] text-mute leading-relaxed">
                  {t("notifications.emptyDesc")}
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    markAsRead(item.id);
                    setIsOpen(false);
                    if (item.href) {
                      router.push(item.href);
                    }
                  }}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition cursor-pointer ${
                    item.read
                      ? "bg-canvas hover:bg-canvas-soft/60"
                      : "bg-primary-pale/35 hover:bg-primary-pale/60"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-canvas-soft border border-border flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(item.kind)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-ink truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono text-mute shrink-0">
                        {item.timeLabel}
                      </span>
                    </div>
                    <p className="text-xs text-body mt-0.5 leading-snug break-words">
                      {item.body}
                    </p>
                  </div>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-positive shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
