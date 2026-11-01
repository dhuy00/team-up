"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EventActivity } from "@/types/models";
import {
  DEFAULT_QUICK_FILTER,
  DEFAULT_SPORT_FILTER,
  DISTANCE_FILTER_CONFIG,
  QuickFilterState,
} from "@/constants/explore";
import { useEvents } from "@/hooks/useEvents";
import { HeroSection } from "@/components/home/HeroSection";
import { ExploreSection } from "@/components/explore/ExploreSection";

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    events,
    setEvents,
    createEvent,
    toggleJoinEvent,
    transferHost,
    deleteEvent,
  } = useEvents();

  const urlSport = searchParams?.get("sport") || DEFAULT_QUICK_FILTER.sport;
  const urlRadius = searchParams?.get("radius")
    ? Number(searchParams.get("radius"))
    : DEFAULT_QUICK_FILTER.radius;

  const [quickFilter, setQuickFilter] = useState<QuickFilterState>({
    sport: urlSport,
    radius: Number.isFinite(urlRadius)
      ? urlRadius
      : DEFAULT_QUICK_FILTER.radius,
  });

  const syncExploreUrl = useCallback(
    (updates: { sport?: string; radius?: number }) => {
      if (pathname && pathname !== "/" && !pathname.startsWith("/explore")) {
        return;
      }
      const params = new URLSearchParams(searchParams?.toString() || "");
      const nextSport = updates.sport ?? quickFilter.sport;
      const nextRadius = updates.radius ?? quickFilter.radius;

      if (nextSport && nextSport !== DEFAULT_SPORT_FILTER) {
        params.set("sport", nextSport);
      } else {
        params.delete("sport");
      }

      if (nextRadius && nextRadius !== DISTANCE_FILTER_CONFIG.DEFAULT) {
        params.set("radius", String(nextRadius));
      } else {
        params.delete("radius");
      }

      const base = pathname || "/";
      const qs = params.toString();
      router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    },
    [pathname, quickFilter.radius, quickFilter.sport, router, searchParams]
  );

  // Sync when a new activity is published from the Host Game wizard
  useEffect(() => {
    if (!createdEvent) return;
    createEvent(createdEvent);
  }, [createEvent, createdEvent]);

  const handleScrollToExplore = () => {
    const exploreEl = document.getElementById("explore-section");
    if (exploreEl) {
      exploreEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleQuickFind = (sport: string, distanceKm: number) => {
    setQuickFilter({ sport, radius: distanceKm });
    syncExploreUrl({ sport, radius: distanceKm });
    handleScrollToExplore();
  };

  const handleSportChange = (sport: string) => {
    setQuickFilter((prev) => ({ ...prev, sport }));
    syncExploreUrl({ sport });
  };

  const handleRadiusChange = (radius: number) => {
    setQuickFilter((prev) => ({ ...prev, radius }));
    syncExploreUrl({ radius });
  };

  const handleBrowseSquads = () => {
    if (onNavigateTab) {
      onNavigateTab(2);
      return;
    }
    router.push("/squads");
  };

  const handleOpenChat = (event: EventActivity) => {
    if (onOpenMatchChat) {
      onOpenMatchChat(event);
      return;
    }
    router.push(`/chats?eventId=${event.id}`);
  };

  return (
    <>
      <HeroSection
        onExploreClick={handleScrollToExplore}
        onBrowseSquadsClick={handleBrowseSquads}
        onQuickFind={handleQuickFind}
        selectedSport={quickFilter.sport}
        selectedRadius={quickFilter.radius}
        onSportChange={handleSportChange}
        onRadiusChange={handleRadiusChange}
      />
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ExploreSection
          events={events}
          onToggleJoin={toggleJoinEvent}
          onTransferHost={transferHost}
          onDeleteEvent={deleteEvent}
          onUpdateEvents={setEvents}
          onOpenMatchChat={handleOpenChat}
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
