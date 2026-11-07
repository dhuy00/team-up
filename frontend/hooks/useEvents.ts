"use client";

import { useCallback } from "react";
import type {
  AttendanceStatus,
  ChatChannel,
  EventActivity,
  UserProfile,
} from "@/types/models";
import {
  initialChatChannels,
  initialEvents,
  mockUserProfile,
} from "@/lib/mockData";
import {
  applyPostMatchCheckInToEvent,
  applyPostMatchCheckInToProfile,
} from "@/lib/karma";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/context/ToastContext";
import { useNotifications } from "@/context/NotificationContext";
import {
  EVENTS_STORAGE_KEY,
  computeToggleJoinEvent,
  computeTransferEventHost,
} from "@/services/events";
import { PASSPORT_STORAGE_KEY } from "@/services/passport";
import {
  ACTIVE_CHAT_CHANNEL_STORAGE_KEY,
  CHAT_CHANNELS_STORAGE_KEY,
  LEFT_EVENT_CHATS_STORAGE_KEY,
  buildChannelFromEvent,
} from "@/services/chats";

export function useEvents() {
  const { t } = useTranslation();
  const toast = useToast();
  const { pushNotification } = useNotifications();

  const [events, setEvents] = usePersistentState<EventActivity[]>(
    EVENTS_STORAGE_KEY,
    initialEvents
  );
  const [profile, setProfile] = usePersistentState<UserProfile>(
    PASSPORT_STORAGE_KEY,
    mockUserProfile
  );
  const [, setChatChannels] = usePersistentState<ChatChannel[]>(
    CHAT_CHANNELS_STORAGE_KEY,
    initialChatChannels
  );
  const [, setActiveChatChannelId] = usePersistentState<number>(
    ACTIVE_CHAT_CHANNEL_STORAGE_KEY,
    1
  );
  const [, setLeftEventChatIds] = usePersistentState<number[]>(
    LEFT_EVENT_CHATS_STORAGE_KEY,
    []
  );

  const createEvent = useCallback(
    (newEvent: EventActivity) => {
      setEvents((prev) => {
        if (prev.some((ev) => ev.id === newEvent.id)) return prev;
        return [newEvent, ...prev];
      });
      setLeftEventChatIds((prev) => prev.filter((id) => id !== newEvent.id));
      setChatChannels((prev) => {
        const existing = prev.find(
          (c) => c.eventId === newEvent.id || c.title === newEvent.title
        );
        if (existing) {
          setActiveChatChannelId(existing.id);
          return prev;
        }
        const newChannel = buildChannelFromEvent(newEvent, {
          justNowLabel: t("chat.justNow"),
          hostBadgeLabel: t("chat.hostBadge"),
        });
        setActiveChatChannelId(newChannel.id);
        return [newChannel, ...prev];
      });

      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      }).catch(() => {});
    },
    [setActiveChatChannelId, setChatChannels, setEvents, setLeftEventChatIds, t]
  );

  const toggleJoinEvent = useCallback(
    (eventId: number) => {
      const result = computeToggleJoinEvent(
        events,
        eventId,
        "Alex Morgan (You)",
        profile.karma
      );

      if (result.status === "not_found") return;

      if (result.status === "karma_blocked" && result.targetEvent) {
        toast.error(
          t("toast.karmaGateBlocked", {
            min: result.targetEvent.minKarmaRequired ?? 90,
            current: profile.karma,
          })
        );
        return;
      }

      if (result.status === "blocked_host_has_teammates") {
        toast.warning(t("toast.hostCannotLeave"));
        return;
      }

      if (result.status === "deleted_solo_host") {
        setEvents(result.events);
        setChatChannels((prev) => prev.filter((c) => c.eventId !== eventId));
        toast.info(t("toast.matchDeleted"));
        fetch(`/api/events?id=${eventId}`, { method: "DELETE" }).catch(
          () => {}
        );
        return;
      }

      if (result.status === "conflict" && result.conflictingEvent) {
        toast.error(
          t("toast.scheduleConflict", {
            title: result.conflictingEvent.title,
            time: result.conflictingEvent.dateTimeStr,
          })
        );
        return;
      }

      setEvents(result.events);

      fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch(() => {});

      if (
        (result.status === "joined" || result.status === "waitlisted") &&
        result.targetEvent
      ) {
        const target = result.targetEvent;
        const nextCount =
          result.nextConfirmedCount ?? target.confirmedPlayers + 1;
        setLeftEventChatIds((prev) => prev.filter((id) => id !== eventId));
        setChatChannels((prev) => {
          const existing = prev.find(
            (c) => c.eventId === target.id || c.title.includes(target.title)
          );
          if (existing) {
            setActiveChatChannelId(existing.id);
            return prev;
          }
          const newChannel = buildChannelFromEvent(target, {
            playerCount: nextCount,
            justNowLabel: t("chat.justNow"),
            hostBadgeLabel: t("chat.hostBadge"),
          });
          setActiveChatChannelId(newChannel.id);
          return [newChannel, ...prev];
        });
        if (result.status === "waitlisted") {
          toast.info(t("toast.waitlistJoined"));
        } else {
          toast.success(t("toast.spotBooked"));
        }
      } else if (
        result.status === "left" ||
        result.status === "promoted_from_waitlist"
      ) {
        setChatChannels((prev) => prev.filter((c) => c.eventId !== eventId));
        if (result.promotedPlayerName) {
          toast.info(
            t("toast.waitlistPromoted", { name: result.promotedPlayerName })
          );
          pushNotification({
            kind: "waitlist_promoted",
            title: t("notifications.seedWaitlistTitle"),
            body: t("toast.waitlistPromoted", {
              name: result.promotedPlayerName,
            }),
            href: `/explore?eventId=${eventId}`,
          });
        } else {
          toast.info(t("toast.spotLeft"));
        }
      }
    },
    [
      events,
      profile.karma,
      pushNotification,
      setActiveChatChannelId,
      setChatChannels,
      setEvents,
      setLeftEventChatIds,
      t,
      toast,
    ]
  );

  const submitMatchCheckIn = useCallback(
    (
      eventId: number,
      attendanceMap: Record<string, AttendanceStatus>,
      badgesAwarded: string[],
      endorseSport: boolean
    ) => {
      const targetEvent = events.find((ev) => ev.id === eventId);
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId
            ? applyPostMatchCheckInToEvent(ev, attendanceMap)
            : ev
        )
      );

      const selfStatus =
        attendanceMap["Alex Morgan (You)"] ||
        attendanceMap[profile.name] ||
        "showed_up";

      setProfile((prev) =>
        applyPostMatchCheckInToProfile(prev, {
          selfAttendance: selfStatus,
          badgesAwarded,
          endorseSportName: endorseSport ? targetEvent?.sport : undefined,
        })
      );

      toast.success(t("toast.checkInSubmitted"));
      pushNotification({
        kind: "karma_update",
        title: t("eventDetail.checkInModalTitle"),
        body: t("toast.checkInSubmitted"),
        href: "/passport",
      });
    },
    [events, profile.name, pushNotification, setEvents, setProfile, t, toast]
  );

  const transferHost = useCallback(
    (eventId: number, newHostName: string) => {
      setEvents((prev) => computeTransferEventHost(prev, eventId, newHostName));
      toast.success(t("toast.hostTransferred", { name: newHostName }));
      fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transfer_host", newHostName }),
      }).catch(() => {});
    },
    [setEvents, t, toast]
  );

  const deleteEvent = useCallback(
    (eventId: number) => {
      setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      setChatChannels((prev) => prev.filter((c) => c.eventId !== eventId));
      toast.info(t("toast.matchDeleted"));
      fetch(`/api/events?id=${eventId}`, { method: "DELETE" }).catch(() => {});
    },
    [setChatChannels, setEvents, t, toast]
  );

  return {
    events,
    setEvents,
    createEvent,
    toggleJoinEvent,
    submitMatchCheckIn,
    transferHost,
    deleteEvent,
  };
}
