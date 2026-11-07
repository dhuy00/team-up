import type {
  AppNotification,
  AppNotificationKind,
  ChatChannel,
  NearbyPlayer,
} from "../types/models";
import { getSportIcon } from "../constants/explore";

export const LFG_BROADCAST_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
export const LFG_STORAGE_KEY = "teamup_lfg_broadcast";
export const NOTIFICATIONS_STORAGE_KEY = "teamup_notifications";

/**
 * Generates privacy-safe fuzzy coordinate offsets (~250m–550m away from exact center)
 * so a player's exact GPS/home coordinates are never exposed on the public Radar.
 */
export function computePrivacyFuzzedOffsets(seed = Date.now()): {
  latOffset: number;
  lngOffset: number;
} {
  const angleRad = ((seed % 360) * Math.PI) / 180;
  // Radius between 0.0025 and 0.0045 degrees (~280m to ~500m)
  const radiusDeg = 0.0025 + ((seed % 20) / 20) * 0.002;
  const latOffset = Number((Math.sin(angleRad) * radiusDeg).toFixed(4));
  const lngOffset = Number((Math.cos(angleRad) * radiusDeg).toFixed(4));

  return {
    latOffset: latOffset === 0 ? 0.0032 : latOffset,
    lngOffset: lngOffset === 0 ? -0.0028 : lngOffset,
  };
}

export function createLfgBroadcast(params: {
  playerName?: string;
  avatar?: string;
  sport: string;
  skill?: string;
  karma?: number;
  statusNote?: string;
  nowMs?: number;
}): NearbyPlayer {
  const now = params.nowMs ?? Date.now();
  const { latOffset, lngOffset } = computePrivacyFuzzedOffsets(now);
  const cleanSport = params.sport || "Soccer";
  const status =
    params.statusNote?.trim() ||
    `Looking for ${cleanSport} game (Next 2h)`;

  return {
    id: "lfg-self",
    name: params.playerName || "Alex Morgan (You)",
    avatar:
      params.avatar ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
    sport: cleanSport,
    sportIcon: getSportIcon(cleanSport),
    skill: params.skill || "Intermediate",
    karma: params.karma ?? 98,
    status,
    latOffset,
    lngOffset,
    isSelf: true,
    expiresAt: now + LFG_BROADCAST_TTL_MS,
  };
}

export function isLfgBroadcastActive(
  broadcast: NearbyPlayer | null | undefined,
  nowMs = Date.now()
): broadcast is NearbyPlayer {
  if (!broadcast) return false;
  if (typeof broadcast.expiresAt === "number" && broadcast.expiresAt <= nowMs) {
    return false;
  }
  return true;
}

export function mergeActiveNearbyPlayers(
  seedPlayers: NearbyPlayer[],
  selfBroadcast?: NearbyPlayer | null,
  nowMs = Date.now()
): NearbyPlayer[] {
  const activeSeeds = seedPlayers.filter(
    (p) => !p.expiresAt || p.expiresAt > nowMs
  );
  if (isLfgBroadcastActive(selfBroadcast, nowMs)) {
    return [selfBroadcast, ...activeSeeds.filter((p) => p.id !== selfBroadcast.id)];
  }
  return activeSeeds;
}

export function buildDirectPingChannel(
  player: NearbyPlayer,
  existingChannels: ChatChannel[],
  options: {
    youPrefix: string;
    justNowLabel: string;
    messageText: string;
    senderName?: string;
    senderAvatar?: string;
    idSeed?: number;
  }
): { channel: ChatChannel; channels: ChatChannel[] } {
  const nowId = options.idSeed ?? Date.now();
  const newMessage = {
    id: nowId,
    sender: `${options.senderName || "Alex Morgan"} (${options.youPrefix})`,
    avatar:
      options.senderAvatar ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces",
    time: options.justNowLabel,
    text: options.messageText,
    isSelf: true,
  };

  const existing = existingChannels.find(
    (c) =>
      !c.eventId &&
      !c.squadId &&
      c.title.toLowerCase().includes(player.name.toLowerCase())
  );

  if (existing) {
    const updatedChannel: ChatChannel = {
      ...existing,
      lastMessage: `${options.youPrefix}: ${options.messageText}`,
      lastTime: options.justNowLabel,
      messages: [...existing.messages, newMessage],
    };
    return {
      channel: updatedChannel,
      channels: existingChannels.map((c) =>
        c.id === existing.id ? updatedChannel : c
      ),
    };
  }

  const newChannel: ChatChannel = {
    id: nowId + 1,
    title: `Direct: ${player.name}`,
    subtitle: `${player.sportIcon} ${player.sport} • ${player.karma}% Karma • LFG Radar`,
    sportIcon: "👤",
    avatar: player.avatar,
    lastMessage: `${options.youPrefix}: ${options.messageText}`,
    lastTime: options.justNowLabel,
    messages: [newMessage],
  };

  return {
    channel: newChannel,
    channels: [newChannel, ...existingChannels],
  };
}

export function createNotificationItem(params: {
  kind: AppNotificationKind;
  title: string;
  body: string;
  timeLabel?: string;
  href?: string;
  nowMs?: number;
}): AppNotification {
  const now = params.nowMs ?? Date.now();
  return {
    id: `notif-${now}-${Math.random().toString(36).slice(2, 7)}`,
    kind: params.kind,
    title: params.title,
    body: params.body,
    createdAt: now,
    timeLabel: params.timeLabel || "Just now",
    read: false,
    href: params.href,
  };
}

export function countUnreadNotifications(list: AppNotification[]): number {
  return list.reduce((acc, item) => (item.read ? acc : acc + 1), 0);
}

export function markAllNotificationsRead(
  list: AppNotification[]
): AppNotification[] {
  return list.map((item) => (item.read ? item : { ...item, read: true }));
}
