"use client";

import React, { createContext, useCallback, useContext, useMemo } from "react";
import type { AppNotification, AppNotificationKind } from "@/types/models";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useTranslation } from "@/hooks/useTranslation";
import {
  NOTIFICATIONS_STORAGE_KEY,
  countUnreadNotifications,
  createNotificationItem,
  markAllNotificationsRead,
} from "@/lib/realtime";

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  pushNotification: (params: {
    kind: AppNotificationKind;
    title: string;
    body: string;
    href?: string;
  }) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { t } = useTranslation();

  const defaultSeedNotifications: AppNotification[] = useMemo(
    () => [
      {
        id: "seed-notif-1",
        kind: "waitlist_promoted",
        title: t("notifications.seedWaitlistTitle"),
        body: t("notifications.seedWaitlistBody"),
        createdAt: 1700000003000,
        timeLabel: "10m",
        read: false,
        href: "/explore?eventId=3",
      },
      {
        id: "seed-notif-2",
        kind: "match_reminder",
        title: t("notifications.seedReminderTitle"),
        body: t("notifications.seedReminderBody"),
        createdAt: 1700000002000,
        timeLabel: "1h",
        read: false,
        href: "/explore?eventId=1",
      },
      {
        id: "seed-notif-3",
        kind: "host_announcement",
        title: t("notifications.seedPinTitle"),
        body: t("notifications.seedPinBody"),
        createdAt: 1700000001000,
        timeLabel: "2h",
        read: true,
        href: "/chats?channelId=1",
      },
    ],
    [t]
  );

  const [notifications, setNotifications] = usePersistentState<
    AppNotification[]
  >(NOTIFICATIONS_STORAGE_KEY, defaultSeedNotifications);

  const unreadCount = useMemo(
    () => countUnreadNotifications(notifications),
    [notifications]
  );

  const pushNotification = useCallback(
    (params: {
      kind: AppNotificationKind;
      title: string;
      body: string;
      href?: string;
    }) => {
      const nextItem = createNotificationItem({
        ...params,
        timeLabel: t("chat.justNow"),
      });
      setNotifications((prev) => [nextItem, ...prev.slice(0, 29)]);
    },
    [setNotifications, t]
  );

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
    },
    [setNotifications]
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => markAllNotificationsRead(prev));
  }, [setNotifications]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      pushNotification,
      markAsRead,
      markAllRead,
      clearNotifications,
    }),
    [
      notifications,
      unreadCount,
      pushNotification,
      markAsRead,
      markAllRead,
      clearNotifications,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return ctx;
}
