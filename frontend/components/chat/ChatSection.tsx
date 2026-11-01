"use client";

import React, { useEffect, useState } from "react";
import { ChatChannel, EventActivity, TeamSquad } from "@/types/models";
import { initialChatChannels, initialEvents, initialSquads } from "@/lib/mockData";
import { useTranslation } from "@/hooks/useTranslation";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useToast } from "@/context/ToastContext";
import { getSportIcon } from "@/constants/explore";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ChannelSidebar } from "./ChannelSidebar";
import { ChatMessageList } from "./ChatMessageList";
import { ChatComposer } from "./ChatComposer";
import {
  detectChannelKind,
  getChannelPinnedItems,
  togglePinnedItem,
} from "@/lib/chatUtils";

interface ChatSectionProps {
  focusedEvent?: EventActivity | null;
}

export const ChatSection: React.FC<ChatSectionProps> = ({ focusedEvent }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [channels, setChannels] = usePersistentState<ChatChannel[]>(
    "teamup_chat_channels",
    initialChatChannels
  );
  const [events, setEvents] = usePersistentState<EventActivity[]>(
    "teamup_events",
    initialEvents
  );
  const [squads, setSquads] = usePersistentState<TeamSquad[]>(
    "teamup_squads",
    initialSquads
  );
  const [, setRequestedSquads] = usePersistentState<number[]>(
    "teamup_requested_squads",
    []
  );
  const [leftSquadChatIds, setLeftSquadChatIds] = usePersistentState<number[]>(
    "teamup_left_squad_chats",
    []
  );
  const [leftEventChatIds, setLeftEventChatIds] = usePersistentState<number[]>(
    "teamup_left_event_chats",
    []
  );
  const [activeChannelId, setActiveChannelId] = usePersistentState<number>(
    "teamup_active_chat_channel",
    1
  );
  const [channelPendingLeave, setChannelPendingLeave] =
    useState<ChatChannel | null>(null);

  // Ensure any joined/created match in `teamup_events` has a corresponding chat channel
  useEffect(() => {
    const joinedEvents = events.filter(
      (ev) => ev.userJoined && !leftEventChatIds.includes(ev.id)
    );
    if (joinedEvents.length === 0) return;

    setChannels((prev) => {
      const missingEvents = joinedEvents.filter(
        (ev) =>
          !prev.some(
            (c) => c.eventId === ev.id || c.title.includes(ev.title)
          )
      );
      if (missingEvents.length === 0) return prev;

      const backfilledEventChannels: ChatChannel[] = missingEvents.map(
        (ev, idx) => {
          const welcomeText =
            ev.notes || `Welcome to ${ev.title} at ${ev.venue}!`;
          return {
            id: Date.now() + 100 + idx * 2,
            eventId: ev.id,
            title: ev.title,
            subtitle: `${ev.confirmedPlayers} Players • ${ev.dateTimeStr} • ${ev.venue}`,
            sportIcon: ev.icon,
            lastMessage: `${ev.host.name}: ${welcomeText}`,
            lastTime: t("chat.justNow"),
            pinnedAnnouncement: ev.notes || undefined,
            messages: [
              {
                id: Date.now() + 100 + idx * 2 + 1,
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
        }
      );

      return [...backfilledEventChannels, ...prev];
    });
  }, [events, leftEventChatIds, setChannels, t]);

  // Ensure any user-created squad in `teamup_squads` has a corresponding chat channel
  useEffect(() => {
    const userCreatedSquads = squads.filter(
      (sq) => sq.captain.includes("(You)") && !leftSquadChatIds.includes(sq.id)
    );
    if (userCreatedSquads.length === 0) return;

    setChannels((prev) => {
      const missingSquads = userCreatedSquads.filter(
        (sq) =>
          !prev.some((c) => c.squadId === sq.id || c.title === sq.name)
      );
      if (missingSquads.length === 0) return prev;

      const backfilledChannels: ChatChannel[] = missingSquads.map((sq, idx) => {
        const welcomeText =
          sq.description || `Welcome to ${sq.name} at ${sq.venue}!`;
        return {
          id: Date.now() + idx * 2,
          squadId: sq.id,
          title: sq.name,
          subtitle: `${sq.sport} • ${t("clubs.membersCount", {
            current: sq.memberCount,
            max: sq.maxMembers,
          })} • ${sq.venue}`,
          sportIcon: getSportIcon(sq.sport),
          lastMessage: `${sq.captain}: ${welcomeText}`,
          lastTime: t("chat.justNow"),
          pinnedAnnouncement: sq.description || undefined,
          messages: [
            {
              id: Date.now() + idx * 2 + 1,
              sender: `${sq.captain} (${t("chat.hostBadge")})`,
              avatar:
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces",
              time: t("chat.justNow"),
              text: welcomeText,
              isHost: true,
              isSelf: true,
            },
          ],
        };
      });

      return [...backfilledChannels, ...prev];
    });
  }, [leftSquadChatIds, setChannels, squads, t]);

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
            isSelf: Boolean(
              focusedEvent.isUserHost ||
                focusedEvent.host.name.includes("Alex Morgan")
            ),
          },
        ],
      };

      setActiveChannelId(newChannel.id);
      return [newChannel, ...prev];
    });
  }, [focusedEvent, setActiveChannelId, setChannels, t]);

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
      isSelf: true,
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

  const handleTogglePinMessage = (
    messageId: number | string,
    text: string
  ) => {
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === activeChannel.id) {
          const currentPins = getChannelPinnedItems(c);
          const nextPins = togglePinnedItem(currentPins, messageId, text);
          return {
            ...c,
            pinnedItems: nextPins,
            pinnedMessages: nextPins.map((item) => item.text),
            pinnedAnnouncement: nextPins[0]?.text,
          };
        }
        return c;
      })
    );
  };

  const handleTogglePinChannel = (channelId: number) => {
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === channelId) {
          const nextPinned = !c.isPinned;
          return {
            ...c,
            isPinned: nextPinned,
            pinnedAt: nextPinned ? Date.now() : undefined,
          };
        }
        return c;
      })
    );
  };

  const getChannelKind = (
    channel?: ChatChannel | null
  ): "squad" | "match" | "direct" => detectChannelKind(channel, squads, events);

  const getLeaveCopy = (channel?: ChatChannel | null) => {
    const kind = getChannelKind(channel);
    const name = channel?.title || "";
    if (kind === "squad") {
      return {
        buttonLabel: t("chat.leaveSquad"),
        dialogTitle: t("chat.leaveSquadConfirmTitle"),
        dialogMessage: t("chat.leaveSquadConfirmMessage", { name }),
      };
    }
    if (kind === "direct") {
      return {
        buttonLabel: t("chat.leaveChat"),
        dialogTitle: t("chat.leaveChatConfirmTitle"),
        dialogMessage: t("chat.leaveChatConfirmMessage", { name }),
      };
    }
    return {
      buttonLabel: t("chat.leaveMatch"),
      dialogTitle: t("chat.leaveMatchConfirmTitle"),
      dialogMessage: t("chat.leaveMatchConfirmMessage", { name }),
    };
  };

  const handleConfirmLeaveChannel = () => {
    if (!channelPendingLeave) return;

    const kind = getChannelKind(channelPendingLeave);

    if (kind === "match") {
      const linkedEvent = events.find(
        (ev) =>
          ev.id === channelPendingLeave.eventId ||
          channelPendingLeave.title === ev.title ||
          channelPendingLeave.title.includes(ev.title)
      );

      if (linkedEvent) {
        const isUserHost = Boolean(
          linkedEvent.isUserHost || linkedEvent.host.name.includes("(You)")
        );

        if (linkedEvent.userJoined && isUserHost) {
          if (linkedEvent.roster.length > 1) {
            setChannelPendingLeave(null);
            toast.warning(t("toast.hostCannotLeave"));
            return;
          }
          // Solo host leaving match chat cancels/deletes the match
          setEvents((prev) => prev.filter((ev) => ev.id !== linkedEvent.id));
          setLeftEventChatIds((prev) =>
            prev.includes(linkedEvent.id) ? prev : [...prev, linkedEvent.id]
          );
          const remaining = channels.filter(
            (c) => c.id !== channelPendingLeave.id
          );
          setChannels(remaining);
          if (
            remaining.length > 0 &&
            activeChannelId === channelPendingLeave.id
          ) {
            setActiveChannelId(remaining[0].id);
          }
          toast.info(t("toast.matchDeleted"));
          setChannelPendingLeave(null);
          return;
        }

        if (linkedEvent.userJoined) {
          setEvents((prev) =>
            prev.map((ev) => {
              if (ev.id !== linkedEvent.id) return ev;
              return {
                ...ev,
                userJoined: false,
                isUserHost: false,
                confirmedPlayers: Math.max(0, ev.confirmedPlayers - 1),
                roster: ev.roster.filter((p) => !p.name.includes("(You)")),
              };
            })
          );
        }

        setLeftEventChatIds((prev) =>
          prev.includes(linkedEvent.id) ? prev : [...prev, linkedEvent.id]
        );
      }

      const remaining = channels.filter((c) => c.id !== channelPendingLeave.id);
      setChannels(remaining);
      if (remaining.length > 0 && activeChannelId === channelPendingLeave.id) {
        setActiveChannelId(remaining[0].id);
      }
      toast.info(t("toast.spotLeft"));
      setChannelPendingLeave(null);
      return;
    }

    if (kind === "squad") {
      const linkedSquad = squads.find(
        (sq) =>
          sq.id === channelPendingLeave.squadId ||
          sq.name === channelPendingLeave.title
      );

      if (linkedSquad) {
        const isCaptain = linkedSquad.captain.includes("(You)");
        setRequestedSquads((prev) =>
          prev.filter((id) => id !== linkedSquad.id)
        );
        setLeftSquadChatIds((prev) =>
          prev.includes(linkedSquad.id) ? prev : [...prev, linkedSquad.id]
        );
        if (isCaptain) {
          setSquads((prev) => prev.filter((sq) => sq.id !== linkedSquad.id));
        }
      }

      const remaining = channels.filter((c) => c.id !== channelPendingLeave.id);
      setChannels(remaining);
      if (remaining.length > 0 && activeChannelId === channelPendingLeave.id) {
        setActiveChannelId(remaining[0].id);
      }
      toast.info(
        linkedSquad?.captain.includes("(You)")
          ? t("toast.squadDeleted")
          : t("toast.leftSquadChat", { name: channelPendingLeave.title })
      );
      setChannelPendingLeave(null);
      return;
    }

    const remaining = channels.filter((c) => c.id !== channelPendingLeave.id);
    setChannels(remaining);
    if (remaining.length > 0 && activeChannelId === channelPendingLeave.id) {
      setActiveChannelId(remaining[0].id);
    }
    toast.info(t("toast.leftSquadChat", { name: channelPendingLeave.title }));
    setChannelPendingLeave(null);
  };

  const activeLeaveCopy = getLeaveCopy(activeChannel);
  const pendingLeaveCopy = getLeaveCopy(channelPendingLeave);

  return (
    <>
      <section className="bg-canvas rounded-[24px] border border-border overflow-hidden grid grid-cols-1 md:grid-cols-12 md:h-[calc(100vh-140px)] md:min-h-[480px] md:max-h-[680px] shadow-sm transition-colors duration-200">
        <ChannelSidebar
          channels={channels}
          activeChannelId={activeChannel?.id ?? -1}
          onSelectChannel={setActiveChannelId}
          onTogglePinChannel={handleTogglePinChannel}
        />

        <div className="md:col-span-8 flex flex-col h-[calc(100vh-260px)] min-h-[420px] md:h-full md:min-h-0 bg-canvas overflow-hidden">
          {activeChannel ? (
            <>
              <ChatMessageList
                channel={activeChannel}
                onTogglePinMessage={handleTogglePinMessage}
                onLeaveChannel={() => setChannelPendingLeave(activeChannel)}
                leaveLabel={activeLeaveCopy.buttonLabel}
              />
              <ChatComposer onSendMessage={handleSendMessage} />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <h3 className="font-[900] text-lg text-ink tracking-tight">
                {t("chat.noActiveChats")}
              </h3>
              <p className="text-xs sm:text-sm text-mute mt-1 max-w-sm">
                {t("chat.noActiveChatsDesc")}
              </p>
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        isOpen={Boolean(channelPendingLeave)}
        title={pendingLeaveCopy.dialogTitle}
        message={pendingLeaveCopy.dialogMessage}
        confirmLabel={pendingLeaveCopy.buttonLabel}
        cancelLabel={t("common.cancel")}
        onConfirm={handleConfirmLeaveChannel}
        onCancel={() => setChannelPendingLeave(null)}
      />
    </>
  );
};
