"use client";

import React, { useState, useSyncExternalStore } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CreateEventModal } from "@/components/explore/CreateEventModal";
import { ChatChannel, EventActivity } from "@/types/models";
import { initialChatChannels, initialEvents } from "@/lib/mockData";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useTranslation } from "@/hooks/useTranslation";
import {
  NAV_TAB_IDS,
  CurrentPageRenderer,
} from "@/components/navigation/routes";

const emptySubscribe = () => () => {};

export default function Home() {
  const { t } = useTranslation();
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [activeTab, setActiveTab] = usePersistentState<number>(
    "teamup_active_tab",
    NAV_TAB_IDS.EXPLORE
  );
  const [, setEvents] = usePersistentState<EventActivity[]>(
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [focusedChatEvent, setFocusedChatEvent] =
    useState<EventActivity | null>(null);

  const handleTabChange = (tabId: number) => {
    if (tabId !== NAV_TAB_IDS.CHATS) {
      setFocusedChatEvent(null);
    }
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleEventCreated = (newEvent: EventActivity) => {
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
      const welcomeText =
        newEvent.notes || `Welcome to ${newEvent.title} at ${newEvent.venue}!`;
      const newChannel: ChatChannel = {
        id: Date.now(),
        eventId: newEvent.id,
        title: newEvent.title,
        subtitle: `${newEvent.confirmedPlayers} Players • ${newEvent.dateTimeStr} • ${newEvent.venue}`,
        sportIcon: newEvent.icon,
        lastMessage: `${newEvent.host.name}: ${welcomeText}`,
        lastTime: t("chat.justNow"),
        pinnedAnnouncement: newEvent.notes || undefined,
        messages: [
          {
            id: Date.now() + 1,
            sender: `${newEvent.host.name} (${t("chat.hostBadge")})`,
            avatar: newEvent.host.avatar,
            time: t("chat.justNow"),
            text: welcomeText,
            isHost: true,
            isSelf: true,
          },
        ],
      };
      setActiveChatChannelId(newChannel.id);
      return [newChannel, ...prev];
    });
    handleTabChange(NAV_TAB_IDS.EXPLORE);
  };

  const handleOpenMatchChat = (event: EventActivity) => {
    setFocusedChatEvent(event);
    setActiveTab(NAV_TAB_IDS.CHATS);
    window.scrollTo({ top: 0, behavior: "instant" });
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
