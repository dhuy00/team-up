"use client";

import React, { useState } from "react";
import Navigation from "@/components/Navigation";
import { CreateEventModal } from "@/components/explore/CreateEventModal";
import { initialEvents } from "@/lib/mockData";
import { EventActivity } from "@/types/models";
import {
  DEFAULT_QUICK_FILTER,
  QuickFilterState,
} from "@/constants/explore";
import {
  NAV_TAB_IDS,
  CurrentPageRenderer,
  APP_ROUTES,
} from "@/components/navigation/routes";

export default function Home() {
  const [activeTab, setActiveTab] = useState<number>(NAV_TAB_IDS.EXPLORE);
  const [events, setEvents] = useState<EventActivity[]>(initialEvents);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilterState>(DEFAULT_QUICK_FILTER);

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

  const handleEventCreated = (newEvent: EventActivity) => {
    setEvents((prev) => [newEvent, ...prev]);
    setActiveTab(NAV_TAB_IDS.EXPLORE);
  };

  const handleQuickFind = (sport: string, distanceKm: number) => {
    setQuickFilter({ sport, radius: distanceKm });
    setActiveTab(NAV_TAB_IDS.EXPLORE);
    const exploreEl = document.getElementById("explore-section");
    if (exploreEl) {
      exploreEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScrollToExplore = () => {
    const exploreEl = document.getElementById("explore-section");
    if (exploreEl) {
      exploreEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas-soft text-ink transition-colors duration-200">
      {/* Global Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
        onHostGameClick={() => setIsCreateModalOpen(true)}
      />

      {/* Render current page dynamically without condition chaining */}
      <CurrentPageRenderer
        activeTab={activeTab}
        events={events}
        onToggleJoin={handleToggleJoin}
        quickFilter={quickFilter}
        onQuickFind={handleQuickFind}
        onExploreClick={handleScrollToExplore}
        onNavigateTab={setActiveTab}
        onOpenCreateEvent={() => setIsCreateModalOpen(true)}
      />

      {/* Host Game Wizard Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={handleEventCreated}
      />

      {/* Global Footer */}
      <footer className="bg-ink text-canvas-soft py-10 mt-16 border-t border-border transition-colors">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-[10px] bg-canvas text-ink flex items-center justify-center font-black text-sm">
                TU
              </div>
              <span className="font-extrabold text-lg text-canvas">TeamUp &amp; SocialFinding</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs text-mute font-medium">
              {APP_ROUTES.map((route) => (
                <button
                  key={route.id}
                  onClick={() => setActiveTab(route.id)}
                  className="hover:text-canvas transition cursor-pointer"
                >
                  {route.key === "explore"
                    ? "Explore Games"
                    : route.key === "squads"
                    ? "Clubs & Squads"
                    : route.key === "chats"
                    ? "Messages"
                    : "Sports Passport"}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-mute gap-3">
            <span>&copy; 2026 TeamUp &amp; SocialFinding. Built following the Wise design system.</span>
            <span>Reliable Pickup Sports &amp; Social Finding Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
