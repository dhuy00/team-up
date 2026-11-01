import type {
  ChatChannel,
  ChatMessage,
  EventActivity,
  PinnedChatMessage,
  TeamSquad,
} from "../types/models";

/**
 * Normalizes a channel's pinned announcements/messages into `PinnedChatMessage[]`
 * keyed by unique message ID so duplicate message texts do not collide.
 */
export function getChannelPinnedItems(
  channel: ChatChannel
): PinnedChatMessage[] {
  if (Array.isArray(channel.pinnedItems)) {
    return channel.pinnedItems;
  }

  if (Array.isArray(channel.pinnedMessages)) {
    const usedIds = new Set<number | string>();
    return channel.pinnedMessages.map((text, idx) => {
      if (channel.pinnedAnnouncement === text && !usedIds.has("announcement")) {
        usedIds.add("announcement");
        return { id: "announcement", text };
      }
      const matchedMsg = channel.messages.find(
        (m) => m.text === text && !usedIds.has(m.id)
      );
      if (matchedMsg) {
        usedIds.add(matchedMsg.id);
        return { id: matchedMsg.id, text };
      }
      const fallbackId = `legacy-pin-${idx}`;
      usedIds.add(fallbackId);
      return { id: fallbackId, text };
    });
  }

  if (channel.pinnedAnnouncement) {
    return [{ id: "announcement", text: channel.pinnedAnnouncement }];
  }

  return [];
}

/**
 * Toggles a specific message pin by its unique `messageId`.
 */
export function togglePinnedItem(
  currentPins: PinnedChatMessage[],
  messageId: number | string,
  text: string
): PinnedChatMessage[] {
  const exists = currentPins.some((item) => item.id === messageId);
  return exists
    ? currentPins.filter((item) => item.id !== messageId)
    : [...currentPins, { id: messageId, text }];
}

/**
 * Sorts chat channels so pinned channels appear at the top ordered by `pinnedAt`.
 */
export function sortChatChannels(channels: ChatChannel[]): ChatChannel[] {
  return [...channels].sort((a, b) => {
    if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
      return a.isPinned ? -1 : 1;
    }
    if (a.isPinned && b.isPinned) {
      return (a.pinnedAt || 0) - (b.pinnedAt || 0);
    }
    return 0;
  });
}

/**
 * Determines whether a chat message belongs to the current user (`Alex Morgan` / `You`).
 */
export function isOwnChatMessage(
  msg: ChatMessage,
  localizedYouPrefix = "You"
): boolean {
  return (
    Boolean(msg.isSelf) ||
    msg.sender.startsWith("Alex Morgan") ||
    msg.sender === "You" ||
    msg.sender === localizedYouPrefix ||
    msg.sender.includes("(You)") ||
    msg.sender.includes("(Bạn)") ||
    msg.sender.includes(`(${localizedYouPrefix})`)
  );
}

/**
 * Classifies a chat channel into `"squad"`, `"match"`, or `"direct"` for context-aware UI.
 */
export function detectChannelKind(
  channel: ChatChannel | null | undefined,
  squads: TeamSquad[],
  events: EventActivity[]
): "squad" | "match" | "direct" {
  if (!channel) return "match";
  if (
    channel.squadId !== undefined ||
    squads.some((sq) => sq.name === channel.title)
  ) {
    return "squad";
  }
  if (
    channel.eventId !== undefined ||
    events.some(
      (ev) => ev.title === channel.title || channel.title.includes(ev.title)
    )
  ) {
    return "match";
  }
  if (channel.subtitle.toLowerCase().includes("direct")) {
    return "direct";
  }
  return "match";
}
