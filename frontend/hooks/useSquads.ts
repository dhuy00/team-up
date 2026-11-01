"use client";

import { useCallback, useEffect } from "react";
import type { ChatChannel, TeamSquad } from "@/types/models";
import { initialChatChannels, initialSquads } from "@/lib/mockData";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/context/ToastContext";
import { getSportIcon } from "@/constants/explore";
import {
  REQUESTED_SQUADS_STORAGE_KEY,
  SQUADS_STORAGE_KEY,
  normalizeLegacySquads,
} from "@/services/squads";
import {
  ACTIVE_CHAT_CHANNEL_STORAGE_KEY,
  CHAT_CHANNELS_STORAGE_KEY,
  LEFT_SQUAD_CHATS_STORAGE_KEY,
  buildChannelFromSquad,
} from "@/services/chats";

export function useSquads() {
  const { t } = useTranslation();
  const toast = useToast();

  const [squads, setSquads] = usePersistentState<TeamSquad[]>(
    SQUADS_STORAGE_KEY,
    initialSquads
  );
  const [requestedSquads, setRequestedSquads] = usePersistentState<number[]>(
    REQUESTED_SQUADS_STORAGE_KEY,
    []
  );
  const [, setChatChannels] = usePersistentState<ChatChannel[]>(
    CHAT_CHANNELS_STORAGE_KEY,
    initialChatChannels
  );
  const [, setActiveChatChannelId] = usePersistentState<number>(
    ACTIVE_CHAT_CHANNEL_STORAGE_KEY,
    1
  );
  const [, setLeftSquadChatIds] = usePersistentState<number[]>(
    LEFT_SQUAD_CHATS_STORAGE_KEY,
    []
  );

  useEffect(() => {
    const result = normalizeLegacySquads(squads);
    if (result.changed) {
      setSquads(result.squads);
    }
  }, [squads, setSquads]);

  const requestInvite = useCallback(
    (squadId: number) => {
      const alreadyRequested = requestedSquads.includes(squadId);
      setRequestedSquads((prev) =>
        alreadyRequested
          ? prev.filter((id) => id !== squadId)
          : [...prev, squadId]
      );
      if (alreadyRequested) {
        setChatChannels((prev) => prev.filter((c) => c.squadId !== squadId));
        toast.info(t("toast.inviteCancelled"));
      } else {
        setLeftSquadChatIds((prev) => prev.filter((id) => id !== squadId));
        const targetSquad = squads.find((sq) => sq.id === squadId);
        if (targetSquad) {
          const isCaptain = targetSquad.captain.includes("(You)");
          setChatChannels((prev) => {
            const existing = prev.find(
              (c) =>
                c.squadId === targetSquad.id || c.title === targetSquad.name
            );
            if (existing) {
              setActiveChatChannelId(existing.id);
              return prev;
            }
            const newChannel = buildChannelFromSquad(targetSquad, {
              isCaptain,
              membersLabel: t("clubs.membersCount", {
                current: targetSquad.memberCount,
                max: targetSquad.maxMembers,
              }),
              justNowLabel: t("chat.justNow"),
              hostBadgeLabel: t("chat.hostBadge"),
            });
            setActiveChatChannelId(newChannel.id);
            return [newChannel, ...prev];
          });
        }
        toast.success(t("toast.inviteRequested"));
      }
    },
    [
      requestedSquads,
      setActiveChatChannelId,
      setChatChannels,
      setLeftSquadChatIds,
      setRequestedSquads,
      squads,
      t,
      toast,
    ]
  );

  const createSquad = useCallback(
    (newSquad: TeamSquad) => {
      setSquads((prev) => [newSquad, ...prev]);
      setRequestedSquads((prev) => [...prev, newSquad.id]);
      setLeftSquadChatIds((prev) => prev.filter((id) => id !== newSquad.id));
      const newChannel = buildChannelFromSquad(newSquad, {
        isCaptain: true,
        membersLabel: t("clubs.membersCount", {
          current: newSquad.memberCount,
          max: newSquad.maxMembers,
        }),
        justNowLabel: t("chat.justNow"),
        hostBadgeLabel: t("chat.hostBadge"),
      });
      setChatChannels((prev) => [newChannel, ...prev]);
      setActiveChatChannelId(newChannel.id);
      toast.success(t("toast.squadCreated"));
    },
    [
      setActiveChatChannelId,
      setChatChannels,
      setLeftSquadChatIds,
      setRequestedSquads,
      setSquads,
      t,
      toast,
    ]
  );

  const updateSquad = useCallback(
    (updatedSquad: TeamSquad) => {
      setSquads((prev) =>
        prev.map((sq) => (sq.id === updatedSquad.id ? updatedSquad : sq))
      );
      setChatChannels((prev) =>
        prev.map((c) => {
          if (c.squadId === updatedSquad.id) {
            return {
              ...c,
              title: updatedSquad.name,
              sportIcon: getSportIcon(updatedSquad.sport),
              subtitle: `${updatedSquad.sport} • ${t("clubs.membersCount", {
                current: updatedSquad.memberCount,
                max: updatedSquad.maxMembers,
              })} • ${updatedSquad.venue}`,
            };
          }
          return c;
        })
      );
      toast.success(t("toast.squadUpdated"));
    },
    [setChatChannels, setSquads, t, toast]
  );

  const deleteSquad = useCallback(
    (squadId: number) => {
      setSquads((prev) => prev.filter((sq) => sq.id !== squadId));
      setRequestedSquads((prev) => prev.filter((id) => id !== squadId));
      setChatChannels((prev) => prev.filter((c) => c.squadId !== squadId));
      toast.info(t("toast.squadDeleted"));
    },
    [setChatChannels, setRequestedSquads, setSquads, t, toast]
  );

  return {
    squads,
    requestedSquads,
    requestInvite,
    createSquad,
    updateSquad,
    deleteSquad,
  };
}
