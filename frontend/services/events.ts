import type { EventActivity } from "../types/models";
import { initialEvents } from "../lib/mockData";
import { findConflictingJoinedEvent } from "../lib/scheduleConflict";

export const EVENTS_STORAGE_KEY = "teamup_events";

export interface JoinEventToggleResult {
  status:
    | "joined"
    | "left"
    | "deleted_solo_host"
    | "blocked_host_has_teammates"
    | "conflict"
    | "not_found";
  events: EventActivity[];
  targetEvent?: EventActivity;
  conflictingEvent?: EventActivity;
  nextConfirmedCount?: number;
}

/**
 * Pure domain service for toggling event participation with Host & Schedule Conflict guards.
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
  }

  const nextConfirmedCount = willJoin
    ? target.confirmedPlayers + 1
    : Math.max(0, target.confirmedPlayers - 1);

  const nextEvents = events.map((ev) => {
    if (ev.id !== eventId) return ev;

    const updatedRoster = willJoin
      ? [
          ...ev.roster,
          { name: currentUserName, role: "Confirmed", karma: currentUserKarma },
        ]
      : ev.roster.filter((p) => !p.name.includes("(You)"));

    return {
      ...ev,
      userJoined: willJoin,
      isUserHost: false,
      confirmedPlayers: nextConfirmedCount,
      roster: updatedRoster,
    };
  });

  return {
    status: willJoin ? "joined" : "left",
    events: nextEvents,
    targetEvent: target,
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
