"use client";

import React, { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CreateEventModal } from "@/components/explore/CreateEventModal";
import { EventActivity } from "@/types/models";
import {
  NAV_TAB_IDS,
  CurrentPageRenderer,
} from "@/components/navigation/routes";

export default function Home() {
  const [activeTab, setActiveTab] = useState<number>(NAV_TAB_IDS.EXPLORE);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<EventActivity | null>(null);
  const [focusedChatEvent, setFocusedChatEvent] =
    useState<EventActivity | null>(null);

  const handleEventCreated = (newEvent: EventActivity) => {
    setCreatedEvent(newEvent);
    setActiveTab(NAV_TAB_IDS.EXPLORE);
  };

  const handleOpenMatchChat = (event: EventActivity) => {
    setFocusedChatEvent(event);
    setActiveTab(NAV_TAB_IDS.CHATS);
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas-soft text-ink transition-colors duration-200">
      {/* Global Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
        onHostGameClick={() => setIsCreateModalOpen(true)}
      />

      {/* Render current page dynamically without condition chaining or leaked state */}
      <CurrentPageRenderer
        activeTab={activeTab}
        onNavigateTab={setActiveTab}
        onOpenCreateEvent={() => setIsCreateModalOpen(true)}
        onOpenMatchChat={handleOpenMatchChat}
        createdEvent={createdEvent}
        focusedChatEvent={focusedChatEvent}
      />

      {/* Host Game Wizard Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={handleEventCreated}
      />

      {/* Global Footer as an independent component */}
      <Footer onTabChange={(tabId) => setActiveTab(tabId)} />
    </div>
  );
}
