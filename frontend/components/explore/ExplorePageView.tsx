"use client";

import React, { useState, useEffect } from "react";
import { EventActivity } from "@/types/models";
import { initialEvents } from "@/lib/mockData";
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
  const [quickFilter, setQuickFilter] =
    useState<QuickFilterState>(DEFAULT_QUICK_FILTER);

  // Sync when a new activity is published from the Host Game wizard
  useEffect(() => {
    if (!createdEvent) return;
    setEvents((prev) => {
      if (prev.some((ev) => ev.id === createdEvent.id)) return prev;
      return [createdEvent, ...prev];
    });
  }, [createdEvent, setEvents]);

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

    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id === eventId) {
          const nextConfirmed = willJoin
            ? ev.confirmedPlayers + 1
            : ev.confirmedPlayers - 1;

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
            confirmedPlayers: nextConfirmed,
            roster: updatedRoster,
          };
        }
        return ev;
      })
    );

    if (willJoin) {
      toast.success(t("toast.spotBooked"));
    } else {
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
