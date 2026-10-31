"use client";

import React, { useState, useEffect } from "react";
import { EventActivity } from "@/types/models";
import { initialEvents } from "@/lib/mockData";
import {
  DEFAULT_QUICK_FILTER,
  QuickFilterState,
} from "@/constants/explore";
import { usePersistentState } from "@/hooks/usePersistentState";
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

  // Encapsulated reservation / spot booking toggle handler
  const handleToggleJoin = (eventId: number) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id === eventId) {
          const nextJoined = !ev.userJoined;
          const nextConfirmed = nextJoined
            ? ev.confirmedPlayers + 1
            : ev.confirmedPlayers - 1;

          const updatedRoster = nextJoined
            ? [
                ...ev.roster,
                { name: "Alex Morgan (You)", role: "Confirmed", karma: 98 },
              ]
            : ev.roster.filter((p) => !p.name.includes("(You)"));

          return {
            ...ev,
            userJoined: nextJoined,
            confirmedPlayers: nextConfirmed,
            roster: updatedRoster,
          };
        }
        return ev;
      })
    );
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
