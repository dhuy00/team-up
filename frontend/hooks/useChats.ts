"use client";

import { useCallback, useEffect } from "react";
import type { ChatChannel, EventActivity, TeamSquad } from "@/types/models";
import { initialChatChannels, initialEvents, initialSquads } from "@/lib/mockData";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/context/ToastContext";
import {
  detectChannelKind,
  getChannelPinnedItems,
  togglePinnedItem,
} from "@/lib/chatUtils";
import {
  ACTIVE_CHAT_CHANNEL_STORAGE_KEY,
  CHAT_CHANNELS_STORAGE_KEY,
  LEFT_EVENT_CHATS_STORAGE_KEY,
  LEFT_SQUAD_CHATS_STORAGE_KEY,
  buildChannelFromEvent,
  buildChannelFromSquad,
} from "@/services/chats";
import { EVENTS_STORAGE_KEY } from "@/services/events";
import {
  REQUESTED_SQUADS_STORAGE_KEY,
  SQUADS_STORAGE_KEY,
} from "@/services/squads";

export function useChats(options?: {
  focusedEvent?: EventActivity | null;
  focusedChannelId?: number | null;
  focusedEventId?: number | null;
}) {
  const { t } = useTranslation();
  const toast = useToast();

  const [channels, setChannels] = usePersistentState<ChatChannel[]>(
    CHAT_CHANNELS_STORAGE_KEY,
    initialChatChannels
  );
  const [events, setEvents] = usePersistentState<EventActivity[]>(
    EVENTS_STORAGE_KEY,
    initialEvents
  );
  const [squads, setSquads] = usePersistentState<TeamSquad[]>(
    SQUADS_STORAGE_KEY,
    initialSquads
  );
  const [, setRequestedSquads] = usePersistentState<number[]>(
    REQUESTED_SQUADS_STORAGE_KEY,
    []
  );
  const [leftSquadChatIds, setLeftSquadChatIds] = usePersistentState<number[]>(
    LEFT_SQUAD_CHATS_STORAGE_KEY,
    []
  );
  const [leftEventChatIds, setLeftEventChatIds] = usePersistentState<number[]>(
    LEFT_EVENT_CHATS_STORAGE_KEY,
    []
  );
  const [activeChannelId, setActiveChannelId] = usePersistentState<number>(
    ACTIVE_CHAT_CHANNEL_STORAGE_KEY,
    1
  );

  // Sync URL-specified channelId when present
  useEffect(() => {
    if (
      options?.focusedChannelId &&
      channels.some((c) => c.id === options.focusedChannelId)
    ) {
      setActiveChannelId(options.focusedChannelId);
    }
  }, [channels, options?.focusedChannelId, setActiveChannelId]);

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
        (ev, idx) =>
          buildChannelFromEvent(ev, {
            justNowLabel: t("chat.justNow"),
            hostBadgeLabel: t("chat.hostBadge"),
            idSeed: Date.now() + 100 + idx * 2,
          })
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
        (sq) => !prev.some((c) => c.squadId === sq.id || c.title === sq.name)
      );
      if (missingSquads.length === 0) return prev;

      const backfilledChannels: ChatChannel[] = missingSquads.map((sq, idx) =>
        buildChannelFromSquad(sq, {
          isCaptain: true,
          membersLabel: t("clubs.membersCount", {
            current: sq.memberCount,
            max: sq.maxMembers,
          }),
          justNowLabel: t("chat.justNow"),
          hostBadgeLabel: t("chat.hostBadge"),
          idSeed: Date.now() + idx * 2,
        })
      );

      return [...backfilledChannels, ...prev];
    });
  }, [leftSquadChatIds, setChannels, squads, t]);

  // Sync or auto-create a match channel when navigating via `focusedEvent` or `focusedEventId`
  const targetEvent =
    options?.focusedEvent ??
    (options?.focusedEventId
      ? events.find((ev) => ev.id === options.focusedEventId) ?? null
      : null);

  useEffect(() => {
    if (!targetEvent) return;

    setChannels((prev) => {
      const existing = prev.find(
        (c) =>
          c.eventId === targetEvent.id || c.title.includes(targetEvent.title)
      );
      if (existing) {
        setActiveChannelId(existing.id);
        return prev;
      }

      const newChannel = buildChannelFromEvent(targetEvent, {
        justNowLabel: t("chat.justNow"),
        hostBadgeLabel: t("chat.hostBadge"),
      });

      setActiveChannelId(newChannel.id);
      return [newChannel, ...prev];
    });
  }, [setActiveChannelId, setChannels, t, targetEvent]);

  const activeChannel =
    channels.find((c) => c.id === activeChannelId) || channels[0];

  const sendMessage = useCallback(
    (text: string) => {
      if (!activeChannel) return;
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
    },
    [activeChannel, setChannels, t]
  );

  const togglePinMessage = useCallback(
    (messageId: number | string, text: string) => {
      if (!activeChannel) return;
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
    },
    [activeChannel, setChannels]
  );

  const togglePinChannel = useCallback(
    (channelId: number) => {
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
    },
    [setChannels]
  );

  const getChannelKind = useCallback(
    (channel?: ChatChannel | null) =>
      detectChannelKind(channel, squads, events),
    [events, squads]
  );

  const leaveChannel = useCallback(
    (channelToLeave: ChatChannel): boolean => {
      const kind = getChannelKind(channelToLeave);

      if (kind === "match") {
        const linkedEvent = events.find(
          (ev) =>
            ev.id === channelToLeave.eventId ||
            channelToLeave.title === ev.title ||
            channelToLeave.title.includes(ev.title)
        );

        if (linkedEvent) {
          const isUserHost = Boolean(
            linkedEvent.isUserHost || linkedEvent.host.name.includes("(You)")
          );

          if (linkedEvent.userJoined && isUserHost) {
            if (linkedEvent.roster.length > 1) {
              toast.warning(t("toast.hostCannotLeave"));
              return false;
            }
            setEvents((prev) => prev.filter((ev) => ev.id !== linkedEvent.id));
            setLeftEventChatIds((prev) =>
              prev.includes(linkedEvent.id) ? prev : [...prev, linkedEvent.id]
            );
            const remaining = channels.filter(
              (c) => c.id !== channelToLeave.id
            );
            setChannels(remaining);
            if (remaining.length > 0 && activeChannelId === channelToLeave.id) {
              setActiveChannelId(remaining[0].id);
            }
            toast.info(t("toast.matchDeleted"));
            return true;
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

        const remaining = channels.filter((c) => c.id !== channelToLeave.id);
        setChannels(remaining);
        if (remaining.length > 0 && activeChannelId === channelToLeave.id) {
          setActiveChannelId(remaining[0].id);
        }
        toast.info(t("toast.spotLeft"));
        return true;
      }

      if (kind === "squad") {
        const linkedSquad = squads.find(
          (sq) =>
            sq.id === channelToLeave.squadId ||
            sq.name === channelToLeave.title
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

        const remaining = channels.filter((c) => c.id !== channelToLeave.id);
        setChannels(remaining);
        if (remaining.length > 0 && activeChannelId === channelToLeave.id) {
          setActiveChannelId(remaining[0].id);
        }
        toast.info(
          linkedSquad?.captain.includes("(You)")
            ? t("toast.squadDeleted")
            : t("toast.leftSquadChat", { name: channelToLeave.title })
        );
        return true;
      }

      const remaining = channels.filter((c) => c.id !== channelToLeave.id);
      setChannels(remaining);
      if (remaining.length > 0 && activeChannelId === channelToLeave.id) {
        setActiveChannelId(remaining[0].id);
      }
      toast.info(t("toast.leftSquadChat", { name: channelToLeave.title }));
      return true;
    },
    [
      activeChannelId,
      channels,
      events,
      getChannelKind,
      setActiveChannelId,
      setChannels,
      setEvents,
      setLeftEventChatIds,
      setLeftSquadChatIds,
      setRequestedSquads,
      setSquads,
      squads,
      t,
      toast,
    ]
  );

  return {
    channels,
    activeChannel,
    activeChannelId,
    setActiveChannelId,
    sendMessage,
    togglePinMessage,
    togglePinChannel,
    getChannelKind,
    leaveChannel,
  };
}
