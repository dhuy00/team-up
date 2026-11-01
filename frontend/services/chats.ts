import type { ChatChannel, EventActivity, TeamSquad } from "../types/models";
import { initialChatChannels } from "../lib/mockData";
import { getSportIcon } from "../constants/explore";

export const CHAT_CHANNELS_STORAGE_KEY = "teamup_chat_channels";
export const ACTIVE_CHAT_CHANNEL_STORAGE_KEY = "teamup_active_chat_channel";
export const LEFT_SQUAD_CHATS_STORAGE_KEY = "teamup_left_squad_chats";
export const LEFT_EVENT_CHATS_STORAGE_KEY = "teamup_left_event_chats";

/**
 * Builds a new `ChatChannel` for an `EventActivity`.
 */
export function buildChannelFromEvent(
  ev: EventActivity,
  options?: {
    playerCount?: number;
    justNowLabel?: string;
    hostBadgeLabel?: string;
    idSeed?: number;
  }
): ChatChannel {
  const playerCount = options?.playerCount ?? ev.confirmedPlayers;
  const justNow = options?.justNowLabel ?? "Just now";
  const hostBadge = options?.hostBadgeLabel ?? "Host";
  const baseId = options?.idSeed ?? Date.now();
  const welcomeText =
    ev.notes || `Welcome to ${ev.title} at ${ev.venue}!`;

  return {
    id: baseId,
    eventId: ev.id,
    title: ev.title,
    subtitle: `${playerCount} Players • ${ev.dateTimeStr} • ${ev.venue}`,
    sportIcon: ev.icon,
    lastMessage: `${ev.host.name}: ${welcomeText}`,
    lastTime: justNow,
    pinnedAnnouncement: ev.notes || undefined,
    messages: [
      {
        id: baseId + 1,
        sender: `${ev.host.name} (${hostBadge})`,
        avatar: ev.host.avatar,
        time: justNow,
        text: welcomeText,
        isHost: true,
        isSelf: Boolean(
          ev.isUserHost || ev.host.name.includes("Alex Morgan")
        ),
      },
    ],
  };
}

/**
 * Builds a new `ChatChannel` for a `TeamSquad`.
 */
export function buildChannelFromSquad(
  squad: TeamSquad,
  options?: {
    isCaptain?: boolean;
    membersLabel?: string;
    justNowLabel?: string;
    hostBadgeLabel?: string;
    idSeed?: number;
  }
): ChatChannel {
  const isCaptain =
    options?.isCaptain ?? squad.captain.includes("(You)");
  const membersText =
    options?.membersLabel ??
    `${squad.memberCount} / ${squad.maxMembers} Members`;
  const justNow = options?.justNowLabel ?? "Just now";
  const hostBadge = options?.hostBadgeLabel ?? "Host";
  const baseId = options?.idSeed ?? Date.now();
  const welcomeText =
    squad.description || `Welcome to ${squad.name} at ${squad.venue}!`;

  return {
    id: baseId,
    squadId: squad.id,
    title: squad.name,
    subtitle: `${squad.sport} • ${membersText} • ${squad.venue}`,
    sportIcon: getSportIcon(squad.sport),
    lastMessage: `${squad.captain}: ${welcomeText}`,
    lastTime: justNow,
    pinnedAnnouncement: squad.description || undefined,
    messages: [
      {
        id: baseId + 1,
        sender: `${squad.captain} (${hostBadge})`,
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces",
        time: justNow,
        text: welcomeText,
        isHost: true,
        isSelf: isCaptain,
      },
    ],
  };
}

export async function fetchChatChannelsAsync(): Promise<ChatChannel[]> {
  if (typeof window === "undefined") return initialChatChannels;
  try {
    const raw = window.localStorage.getItem(CHAT_CHANNELS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatChannel[]) : initialChatChannels;
  } catch {
    return initialChatChannels;
  }
}
