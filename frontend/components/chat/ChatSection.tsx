"use client";

import React, { useEffect } from "react";
import { ChatChannel, EventActivity } from "@/types/models";
import { initialChatChannels } from "@/lib/mockData";
import { useTranslation } from "@/hooks/useTranslation";
import { usePersistentState } from "@/hooks/usePersistentState";
import { ChannelSidebar } from "./ChannelSidebar";
import { ChatMessageList } from "./ChatMessageList";
import { ChatComposer } from "./ChatComposer";

interface ChatSectionProps {
  focusedEvent?: EventActivity | null;
}

export const ChatSection: React.FC<ChatSectionProps> = ({ focusedEvent }) => {
  const { t } = useTranslation();
  const [channels, setChannels] = usePersistentState<ChatChannel[]>(
    "teamup_chat_channels",
    initialChatChannels
  );
  const [activeChannelId, setActiveChannelId] = usePersistentState<number>(
    "teamup_active_chat_channel",
    1
  );

  // Sync or auto-create a match channel when a user navigates from an Event's "Open Match Chat"
  useEffect(() => {
    if (!focusedEvent) return;

    setChannels((prev) => {
      const existing = prev.find(
        (c) => c.eventId === focusedEvent.id || c.title.includes(focusedEvent.title)
      );
      if (existing) {
        setActiveChannelId(existing.id);
        return prev;
      }

      const newChannel: ChatChannel = {
        id: Date.now(),
        eventId: focusedEvent.id,
        title: focusedEvent.title,
        subtitle: `${focusedEvent.confirmedPlayers} Players • ${focusedEvent.dateTimeStr} • ${focusedEvent.venue}`,
        sportIcon: focusedEvent.icon,
        lastMessage: `${focusedEvent.host.name}: ${focusedEvent.notes || "Welcome to the match room!"}`,
        lastTime: t("chat.justNow"),
        pinnedAnnouncement: focusedEvent.notes || undefined,
        messages: [
          {
            id: Date.now() + 1,
            sender: `${focusedEvent.host.name} (${t("chat.hostBadge")})`,
            avatar: focusedEvent.host.avatar,
            time: t("chat.justNow"),
            text:
              focusedEvent.notes ||
              `Welcome to ${focusedEvent.title} at ${focusedEvent.venue}!`,
            isHost: true,
          },
        ],
      };

      setActiveChannelId(newChannel.id);
      return [newChannel, ...prev];
    });
  }, [focusedEvent, setChannels, t]);

  const activeChannel =
    channels.find((c) => c.id === activeChannelId) || channels[0];

  const handleSendMessage = (text: string) => {
    const newMessage = {
      id: Date.now(),
      sender: `Alex Morgan (${t("chat.youPrefix")})`,
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces",
      time: t("chat.justNow"),
      text,
    };

    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === activeChannel.id) {
          return {
            ...c,
            lastMessage: `${t("chat.youPrefix")}: ${text}`,
            lastTime: t("chat.justNow"),
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      })
    );
  };

  const handleTogglePinMessage = (text: string) => {
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === activeChannel.id) {
          const currentPins =
            c.pinnedMessages ??
            (c.pinnedAnnouncement ? [c.pinnedAnnouncement] : []);
          const exists = currentPins.includes(text);
          const nextPins = exists
            ? currentPins.filter((item) => item !== text)
            : [...currentPins, text];
          return {
            ...c,
            pinnedMessages: nextPins,
            pinnedAnnouncement: nextPins[0],
          };
        }
        return c;
      })
    );
  };

  return (
    <section className="bg-canvas rounded-[24px] border border-border overflow-hidden grid grid-cols-1 md:grid-cols-12 md:h-[calc(100vh-140px)] md:min-h-[480px] md:max-h-[680px] shadow-sm transition-colors duration-200">
      <ChannelSidebar
        channels={channels}
        activeChannelId={activeChannel.id}
        onSelectChannel={setActiveChannelId}
      />

      <div className="md:col-span-8 flex flex-col h-[calc(100vh-260px)] min-h-[420px] md:h-full md:min-h-0 bg-canvas overflow-hidden">
        <ChatMessageList
          channel={activeChannel}
          onTogglePinMessage={handleTogglePinMessage}
        />
        <ChatComposer onSendMessage={handleSendMessage} />
      </div>
    </section>
  );
};
