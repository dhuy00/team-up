import type { EventActivity } from "../types/models";
import { initialEvents } from "../lib/mockData";
import { findConflictingJoinedEvent } from "../lib/scheduleConflict";

export const EVENTS_STORAGE_KEY = "teamup_events";

export interface JoinEventToggleResult {
  status:
    | "joined"
    | "waitlisted"
    | "left"
    | "promoted_from_waitlist"
    | "deleted_solo_host"
    | "blocked_host_has_teammates"
    | "conflict"
    | "not_found";
  events: EventActivity[];
  targetEvent?: EventActivity;
  conflictingEvent?: EventActivity;
  promotedPlayerName?: string;
  nextConfirmedCount?: number;
}

/**
 * Pure domain service for toggling event participation with Host, Waitlist & Schedule Conflict guards.
 */
export function computeToggleJoinEvent(
  events: EventActivity[],
  eventId: number,
  currentUserName = "Alex Morgan (You)",
  currentUserKarma = 98
): JoinEventToggleResult {
  const target = events.find((ev) => ev.id === eventId);
  if (!target) {
    return { status: "not_found", events };
  }

  const isUserHost = Boolean(
    target.isUserHost || target.host.name.includes("(You)")
  );

  if (target.userJoined && isUserHost) {
    if (target.roster.length > 1) {
      return {
        status: "blocked_host_has_teammates",
        events,
        targetEvent: target,
      };
    }
    return {
      status: "deleted_solo_host",
      events: events.filter((ev) => ev.id !== eventId),
      targetEvent: target,
    };
  }

  const willJoin = !target.userJoined;

  if (willJoin) {
    const conflictingEvent = findConflictingJoinedEvent(target, events);
    if (conflictingEvent) {
      return {
        status: "conflict",
        events,
        targetEvent: target,
        conflictingEvent,
      };
    }

    const isFull = target.confirmedPlayers >= target.maxPlayers;
    const assignedRole = isFull ? "Waitlist" : "Confirmed";
    const nextConfirmedCount = isFull
      ? target.confirmedPlayers
      : target.confirmedPlayers + 1;

    const nextEvents = events.map((ev) => {
      if (ev.id !== eventId) return ev;
      return {
        ...ev,
        userJoined: true,
        isUserHost: false,
        confirmedPlayers: nextConfirmedCount,
        roster: [
          ...ev.roster,
          {
            name: currentUserName,
            role: assignedRole,
            karma: currentUserKarma,
          },
        ],
      };
    });

    return {
      status: isFull ? "waitlisted" : "joined",
      events: nextEvents,
      targetEvent: target,
      nextConfirmedCount,
    };
  }

  // Leaving event: check if leaving user was on waitlist or confirmed, and promote first waitlisted player if applicable
  const selfEntry = target.roster.find(
    (p) => p.name === currentUserName || p.name.includes("(You)")
  );
  const wasWaitlisted = selfEntry?.role === "Waitlist";
  let remainingRoster = target.roster.filter(
    (p) => p !== selfEntry && !p.name.includes("(You)")
  );
  let promotedPlayerName: string | undefined;

  if (!wasWaitlisted) {
    const firstWaitlistedIdx = remainingRoster.findIndex(
      (p) => p.role === "Waitlist"
    );
    if (firstWaitlistedIdx !== -1) {
      promotedPlayerName = remainingRoster[firstWaitlistedIdx].name;
      remainingRoster = remainingRoster.map((p, idx) =>
        idx === firstWaitlistedIdx ? { ...p, role: "Confirmed" } : p
      );
    }
  }

  const nextConfirmedCount = wasWaitlisted
    ? target.confirmedPlayers
    : promotedPlayerName
      ? target.confirmedPlayers
      : Math.max(0, target.confirmedPlayers - 1);

  const nextEvents = events.map((ev) => {
    if (ev.id !== eventId) return ev;
    return {
      ...ev,
      userJoined: false,
      isUserHost: false,
      confirmedPlayers: nextConfirmedCount,
      roster: remainingRoster,
    };
  });

  return {
    status: promotedPlayerName ? "promoted_from_waitlist" : "left",
    events: nextEvents,
    targetEvent: target,
    promotedPlayerName,
    nextConfirmedCount,
  };
}

/**
 * Pure domain service for transferring the Host role to another roster member.
 */
export function computeTransferEventHost(
  events: EventActivity[],
  eventId: number,
  newHostName: string
): EventActivity[] {
  return events.map((ev) => {
    if (ev.id !== eventId) return ev;

    const newHostPlayer = ev.roster.find((p) => p.name === newHostName);
    const updatedRoster = ev.roster.map((p) => {
      if (p.name === newHostName) {
        return { ...p, role: "Host / Captain" };
      }
      if (p.name.includes("(You)")) {
        return { ...p, role: "Confirmed" };
      }
      return p;
    });

    return {
      ...ev,
      isUserHost: false,
      host: {
        name: newHostName,
        karma: newHostPlayer ? newHostPlayer.karma : ev.host.karma,
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
      },
      roster: updatedRoster,
    };
  });
}

/**
 * Filters events by sport, skill tier, radius, and search query.
 */
export function filterEventsList(
  events: EventActivity[],
  filters: {
    sport: string;
    skill: string;
    maxRadiusKm: number;
    searchQuery: string;
  }
): EventActivity[] {
  const q = (filters.searchQuery || "").trim().toLowerCase();
  const sportFilter = (filters.sport || "all").toLowerCase();
  const skillFilter = (filters.skill || "all").toLowerCase();

  return events.filter((ev) => {
    const matchesSearch =
      q === "" ||
      ev.title.toLowerCase().includes(q) ||
      ev.venue.toLowerCase().includes(q) ||
      ev.sport.toLowerCase().includes(q);

    const matchesSport =
      sportFilter === "all" ||
      sportFilter === "all sports" ||
      ev.sport.toLowerCase() === sportFilter;

    const matchesSkill =
      skillFilter === "all" ||
      skillFilter === "all levels" ||
      ev.skill.toLowerCase() === skillFilter;

    const matchesDistance = ev.distanceKm <= filters.maxRadiusKm;

    return matchesSearch && matchesSport && matchesSkill && matchesDistance;
  });
}

export async function fetchEventsAsync(): Promise<EventActivity[]> {
  if (typeof window === "undefined") return initialEvents;
  try {
    const raw = window.localStorage.getItem(EVENTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EventActivity[]) : initialEvents;
  } catch {
    return initialEvents;
  }
}
