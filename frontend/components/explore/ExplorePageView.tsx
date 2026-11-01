"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChatChannel, EventActivity } from "@/types/models";
import { initialChatChannels, initialEvents } from "@/lib/mockData";
import {
  DEFAULT_QUICK_FILTER,
  QuickFilterState,
} from "@/constants/explore";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/context/ToastContext";
import { findConflictingJoinedEvent } from "@/lib/scheduleConflict";
import { HeroSection } from "@/components/home/HeroSection";
import { ExploreSection } from "@/components/explore/ExploreSection";
import { NAV_TAB_IDS } from "@/components/navigation/routes";

export interface ExplorePageViewProps {
  onNavigateTab?: (tabId: number) => void;
  onOpenCreateEvent?: () => void;
  onOpenMatchChat?: (event: EventActivity) => void;
  createdEvent?: EventActivity | null;
}

export const ExplorePageView: React.FC<ExplorePageViewProps> = ({
  onNavigateTab,
  onOpenMatchChat,
  createdEvent,
}) => {
  const { t } = useTranslation();
  const toast = useToast();

  const [events, setEvents] = usePersistentState<EventActivity[]>(
    "teamup_events",
    initialEvents
  );
  const [, setChatChannels] = usePersistentState<ChatChannel[]>(
    "teamup_chat_channels",
    initialChatChannels
  );
  const [, setActiveChatChannelId] = usePersistentState<number>(
    "teamup_active_chat_channel",
    1
  );
  const [, setLeftEventChatIds] = usePersistentState<number[]>(
    "teamup_left_event_chats",
    []
  );
  const [quickFilter, setQuickFilter] =
    useState<QuickFilterState>(DEFAULT_QUICK_FILTER);

  const buildChannelForEvent = useCallback(
    (ev: EventActivity, playerCount: number): ChatChannel => {
      const welcomeText =
        ev.notes || `Welcome to ${ev.title} at ${ev.venue}!`;
      return {
        id: Date.now(),
        eventId: ev.id,
        title: ev.title,
        subtitle: `${playerCount} Players • ${ev.dateTimeStr} • ${ev.venue}`,
        sportIcon: ev.icon,
        lastMessage: `${ev.host.name}: ${welcomeText}`,
        lastTime: t("chat.justNow"),
        pinnedAnnouncement: ev.notes || undefined,
        messages: [
          {
            id: Date.now() + 1,
            sender: `${ev.host.name} (${t("chat.hostBadge")})`,
            avatar: ev.host.avatar,
            time: t("chat.justNow"),
            text: welcomeText,
            isHost: true,
            isSelf: Boolean(
              ev.isUserHost || ev.host.name.includes("Alex Morgan")
            ),
          },
        ],
      };
    },
    [t]
  );

  // Sync when a new activity is published from the Host Game wizard
  useEffect(() => {
    if (!createdEvent) return;
    setEvents((prev) => {
      if (prev.some((ev) => ev.id === createdEvent.id)) return prev;
      return [createdEvent, ...prev];
    });
    setChatChannels((prev) => {
      const existing = prev.find(
        (c) => c.eventId === createdEvent.id || c.title === createdEvent.title
      );
      if (existing) {
        setActiveChatChannelId(existing.id);
        return prev;
      }
      const newChannel = buildChannelForEvent(
        createdEvent,
        createdEvent.confirmedPlayers
      );
      setActiveChatChannelId(newChannel.id);
      return [newChannel, ...prev];
    });
  }, [
    buildChannelForEvent,
    createdEvent,
    setActiveChatChannelId,
    setChatChannels,
    setEvents,
  ]);

  // Encapsulated reservation / spot booking toggle handler with Host protection
  const handleToggleJoin = (eventId: number) => {
    const target = events.find((ev) => ev.id === eventId);
    if (!target) return;

    const isUserHost = Boolean(
      target.isUserHost || target.host.name.includes("(You)")
    );

    if (target.userJoined && isUserHost) {
      if (target.roster.length > 1) {
        toast.warning(t("toast.hostCannotLeave"));
        return;
      }
      // If solo host with no other players registered, allow deleting the match
      setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      setChatChannels((prev) => prev.filter((c) => c.eventId !== eventId));
      toast.info(t("toast.matchDeleted"));
      return;
    }

    const willJoin = !target.userJoined;

    if (willJoin) {
      const conflictingEvent = findConflictingJoinedEvent(target, events);
      if (conflictingEvent) {
        toast.error(
          t("toast.scheduleConflict", {
            title: conflictingEvent.title,
            time: conflictingEvent.dateTimeStr,
          })
        );
        return;
      }
    }

    const nextConfirmedCount = willJoin
      ? target.confirmedPlayers + 1
      : Math.max(0, target.confirmedPlayers - 1);

    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id === eventId) {
          const updatedRoster = willJoin
            ? [
                ...ev.roster,
                { name: "Alex Morgan (You)", role: "Confirmed", karma: 98 },
              ]
            : ev.roster.filter((p) => !p.name.includes("(You)"));

          return {
            ...ev,
            userJoined: willJoin,
            isUserHost: false,
            confirmedPlayers: nextConfirmedCount,
            roster: updatedRoster,
          };
        }
        return ev;
      })
    );

    if (willJoin) {
      setLeftEventChatIds((prev) => prev.filter((id) => id !== eventId));
      setChatChannels((prev) => {
        const existing = prev.find(
          (c) => c.eventId === target.id || c.title.includes(target.title)
        );
        if (existing) {
          setActiveChatChannelId(existing.id);
          return prev;
        }
        const newChannel = buildChannelForEvent(target, nextConfirmedCount);
        setActiveChatChannelId(newChannel.id);
        return [newChannel, ...prev];
      });
      toast.success(t("toast.spotBooked"));
    } else {
      setChatChannels((prev) => prev.filter((c) => c.eventId !== eventId));
      toast.info(t("toast.spotLeft"));
    }
  };

  // Pass Host role to another teammate in the roster
  const handleTransferHost = (eventId: number, newHostName: string) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;

        const newHostPlayer = ev.roster.find((p) => p.name === newHostName);
        const updatedRoster = ev.roster.map((p) => {
          if (p.name === newHostName) {
            return { ...p, role: "Host / Captain" };
          }
          if (p.name.includes("(You)")) {
            return { ...p, role: "Confirmed" };
          }
          return p;
        });

        return {
          ...ev,
          isUserHost: false,
          host: {
            name: newHostName,
            karma: newHostPlayer ? newHostPlayer.karma : ev.host.karma,
            avatar:
              "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
          },
          roster: updatedRoster,
        };
      })
    );

    toast.success(t("toast.hostTransferred", { name: newHostName }));
  };

  // Delete match when host is the only one registered
  const handleDeleteEvent = (eventId: number) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
    setChatChannels((prev) => prev.filter((c) => c.eventId !== eventId));
    toast.info(t("toast.matchDeleted"));
  };

  const handleScrollToExplore = () => {
    const exploreEl = document.getElementById("explore-section");
    if (exploreEl) {
      exploreEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleQuickFind = (sport: string, distanceKm: number) => {
    setQuickFilter({ sport, radius: distanceKm });
    handleScrollToExplore();
  };

  const handleSportChange = (sport: string) => {
    setQuickFilter((prev) => ({ ...prev, sport }));
  };

  const handleRadiusChange = (radius: number) => {
    setQuickFilter((prev) => ({ ...prev, radius }));
  };

  return (
    <>
      <HeroSection
        onExploreClick={handleScrollToExplore}
        onBrowseSquadsClick={() => onNavigateTab?.(NAV_TAB_IDS.SQUADS)}
        onQuickFind={handleQuickFind}
        selectedSport={quickFilter.sport}
        selectedRadius={quickFilter.radius}
        onSportChange={handleSportChange}
        onRadiusChange={handleRadiusChange}
      />
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ExploreSection
          events={events}
          onToggleJoin={handleToggleJoin}
          onTransferHost={handleTransferHost}
          onDeleteEvent={handleDeleteEvent}
          onUpdateEvents={setEvents}
          onOpenMatchChat={onOpenMatchChat}
          selectedSport={quickFilter.sport}
          selectedRadius={quickFilter.radius}
          onSportChange={handleSportChange}
          onRadiusChange={handleRadiusChange}
        />
      </main>
    </>
  );
};

export default ExplorePageView;
