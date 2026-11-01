"use client";

import React, { useState, useSyncExternalStore } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CreateEventModal } from "@/components/explore/CreateEventModal";
import { EventActivity } from "@/types/models";
import { usePersistentState } from "@/hooks/usePersistentState";
import {
  NAV_TAB_IDS,
  CurrentPageRenderer,
} from "@/components/navigation/routes";

const emptySubscribe = () => () => {};

export default function Home() {
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [activeTab, setActiveTab] = usePersistentState<number>(
    "teamup_active_tab",
    NAV_TAB_IDS.EXPLORE
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<EventActivity | null>(null);
  const [focusedChatEvent, setFocusedChatEvent] =
    useState<EventActivity | null>(null);

  const handleTabChange = (tabId: number) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleEventCreated = (newEvent: EventActivity) => {
    setCreatedEvent(newEvent);
    handleTabChange(NAV_TAB_IDS.EXPLORE);
  };

  const handleOpenMatchChat = (event: EventActivity) => {
    setFocusedChatEvent(event);
    handleTabChange(NAV_TAB_IDS.CHATS);
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas-soft text-ink transition-colors duration-200">
      {/* Global Navigation Bar */}
      <Navigation
        activeTab={isHydrated ? activeTab : undefined}
        onTabChange={handleTabChange}
        onHostGameClick={() => setIsCreateModalOpen(true)}
      />

      {/* Render current page dynamically without condition chaining or leaked state */}
      {isHydrated ? (
        <CurrentPageRenderer
          activeTab={activeTab}
          onNavigateTab={handleTabChange}
          onOpenCreateEvent={() => setIsCreateModalOpen(true)}
          onOpenMatchChat={handleOpenMatchChat}
          createdEvent={createdEvent}
          focusedChatEvent={focusedChatEvent}
        />
      ) : (
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" />
      )}

      {/* Host Game Wizard Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={handleEventCreated}
      />

      {/* Global Footer as an independent component */}
      <Footer onTabChange={handleTabChange} />
    </div>
  );
}
