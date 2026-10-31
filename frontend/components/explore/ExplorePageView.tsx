"use client";

import React, { useState } from "react";
import { EventActivity } from "@/types/models";
import { initialEvents } from "@/lib/mockData";
import {
  DEFAULT_QUICK_FILTER,
  QuickFilterState,
} from "@/constants/explore";
import { HeroSection } from "@/components/home/HeroSection";
import { ExploreSection } from "@/components/explore/ExploreSection";
import { NAV_TAB_IDS } from "@/components/navigation/routes";

export interface ExplorePageViewProps {
  onNavigateTab?: (tabId: number) => void;
  onOpenCreateEvent?: () => void;
  createdEvent?: EventActivity | null;
}

/**
 * ExplorePageView
 * Encapsulates all state, handlers, and sub-components specific to the Explore Games route:
 * - Local events list state
 * - Reservation / RSVP spot toggling (handleToggleJoin)
 * - Quick match finder state (quickFilter)
 * - Coordinated scroll and filter synchronization between Hero and Explore feed
 */
export const ExplorePageView: React.FC<ExplorePageViewProps> = ({
  onNavigateTab,
  createdEvent,
}) => {
  // Encapsulated events state
  const [events, setEvents] = useState<EventActivity[]>(initialEvents);
  const [lastSyncedCreatedId, setLastSyncedCreatedId] = useState<number | null>(
    null
  );

  // Encapsulated quick match filter state
  const [quickFilter, setQuickFilter] = useState<QuickFilterState>(DEFAULT_QUICK_FILTER);

  // Sync when a new activity is published from the Host Game wizard
  if (createdEvent && createdEvent.id !== lastSyncedCreatedId) {
    setLastSyncedCreatedId(createdEvent.id);
    setEvents((prev) => [createdEvent, ...prev]);
  }

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
            ? [...ev.roster, { name: "Alex Morgan (You)", role: "Confirmed", karma: 98 }]
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
