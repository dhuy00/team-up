import type {
  ChatChannel,
  EventActivity,
  SportPassportItem,
  TeamSquad,
  UserProfile,
} from "../types/models";
import {
  initialChatChannels,
  initialEvents,
  initialSquads,
  mockUserProfile,
} from "../lib/mockData";
import { calculateDistanceKm } from "../lib/geo";
import { findConflictingJoinedEvent } from "../lib/scheduleConflict";

export interface AuthUserAccount {
  id: string;
  email: string;
  passwordHash: string;
  onboardingCompleted: boolean;
  profile: UserProfile;
}

export interface SportsVenueRecord {
  id: number;
  name: string;
  address: string;
  sports: string[];
  lat: number;
  lng: number;
  distanceKm: number;
  verified: boolean;
}

export interface DatabaseState {
  users: AuthUserAccount[];
  events: EventActivity[];
  venues: SportsVenueRecord[];
  squads: TeamSquad[];
  requestedSquadIds: number[];
  chatChannels: ChatChannel[];
}

export interface RsvpMutationResult {
  status:
    | "joined"
    | "waitlisted"
    | "left"
    | "promoted_from_waitlist"
    | "deleted_solo_host"
    | "blocked_host_has_teammates"
    | "conflict"
    | "not_found";
  event?: EventActivity;
  promotedPlayerName?: string;
  conflictingEvent?: EventActivity;
  events: EventActivity[];
}

const DEFAULT_VENUES: SportsVenueRecord[] = [
  {
    id: 1,
    name: "Central Turf Arena, Pitch 2",
    address: "420 Olympic Blvd, North District",
    sports: ["Soccer", "Running"],
    lat: 37.781,
    lng: -122.411,
    distanceKm: 1.8,
    verified: true,
  },
  {
    id: 2,
    name: "Venice Courts, Court 4",
    address: "1800 Ocean Front Walk",
    sports: ["Basketball"],
    lat: 37.768,
    lng: -122.429,
    distanceKm: 2.1,
    verified: true,
  },
  {
    id: 3,
    name: "Smash Center Indoor Hall",
    address: "88 Badminton Way, Eastside",
    sports: ["Badminton", "Pickleball"],
    lat: 37.789,
    lng: -122.401,
    distanceKm: 3.4,
    verified: true,
  },
  {
    id: 4,
    name: "Sunset Community Park Courts",
    address: "1250 Sunset Ave",
    sports: ["Pickleball", "Basketball"],
    lat: 37.759,
    lng: -122.448,
    distanceKm: 4.5,
    verified: true,
  },
  {
    id: 5,
    name: "Meeple & Mug Board Game Cafe",
    address: "310 Valencia St, Downtown",
    sports: ["Board Games"],
    lat: 37.766,
    lng: -122.421,
    distanceKm: 1.5,
    verified: true,
  },
];

const DEFAULT_USERS: AuthUserAccount[] = [
  {
    id: "usr-alex-morgan",
    email: "alex@teamup.app",
    passwordHash: "demo123",
    onboardingCompleted: true,
    profile: structuredClone(mockUserProfile),
  },
  {
    id: "usr-marco-silva",
    email: "marco@teamup.app",
    passwordHash: "demo123",
    onboardingCompleted: true,
    profile: {
      ...structuredClone(mockUserProfile),
      name: "Marco Silva",
      username: "@marcosilva",
      location: "North District • 2km radius",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
      karma: 96,
      tier: "Tier 1 • Verified Captain",
      bio: "7v7 Soccer midfielder and North District Thunder club captain. Always bring extra pinnies!",
      matchesCount: 64,
      noShowsCount: 0,
      endorsedCount: 51,
    },
  },
  {
    id: "usr-elena-rostova",
    email: "elena@teamup.app",
    passwordHash: "demo123",
    onboardingCompleted: true,
    profile: {
      ...structuredClone(mockUserProfile),
      name: "Elena Rostova",
      username: "@elenarostova",
      location: "Eastside Courts • 5km radius",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces",
      karma: 100,
      tier: "Tier 1 • Perfect Attendance",
      bio: "Competitive badminton doubles player & weekend trail runner.",
      matchesCount: 38,
      noShowsCount: 0,
      endorsedCount: 36,
    },
  },
];

function createInitialDbState(): DatabaseState {
  return {
    users: structuredClone(DEFAULT_USERS),
    events: structuredClone(initialEvents),
    venues: structuredClone(DEFAULT_VENUES),
    squads: structuredClone(initialSquads),
    requestedSquadIds: [],
    chatChannels: structuredClone(initialChatChannels),
  };
}

// Singleton in-memory database state (persisted across Next.js route invocations)
const globalForDb = globalThis as unknown as {
  __teamupDbState?: DatabaseState;
  __teamupRosterLock?: Promise<void>;
};

export function getDbState(): DatabaseState {
  if (!globalForDb.__teamupDbState) {
    globalForDb.__teamupDbState = createInitialDbState();
  }
  return globalForDb.__teamupDbState;
}

export function resetDbStateForTests(): DatabaseState {
  globalForDb.__teamupDbState = createInitialDbState();
  return globalForDb.__teamupDbState;
}

/**
 * Sequential async mutex lock preventing race conditions during concurrent RSVP operations.
 */
async function withRosterLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const prevLock = globalForDb.__teamupRosterLock ?? Promise.resolve();
  let release!: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  globalForDb.__teamupRosterLock = prevLock.then(() => nextLock);
  await prevLock;
  try {
    return await fn();
  } finally {
    release();
  }
}

/**
 * Geospatial Event Query Engine (Server-side Haversine distance & radius filter)
 */
export function queryEventsGeospatial(params?: {
  sport?: string;
  skill?: string;
  radiusKm?: number;
  centerLat?: number;
  centerLng?: number;
  q?: string;
}): EventActivity[] {
  const db = getDbState();
  const sport = (params?.sport || "all").toLowerCase();
  const skill = (params?.skill || "all").toLowerCase();
  const maxRadius = params?.radiusKm ?? 25;
  const q = (params?.q || "").trim().toLowerCase();
  const hasCenter =
    typeof params?.centerLat === "number" &&
    Number.isFinite(params.centerLat) &&
    typeof params?.centerLng === "number" &&
    Number.isFinite(params.centerLng);

  const computed = db.events.map((ev) => {
    if (!hasCenter) return ev;
    const trueDistance = calculateDistanceKm(
      params!.centerLat!,
      params!.centerLng!,
      ev.lat,
      ev.lng
    );
    return {
      ...ev,
      distanceKm: trueDistance,
    };
  });

  const filtered = computed.filter((ev) => {
    const matchesSearch =
      q === "" ||
      ev.title.toLowerCase().includes(q) ||
      ev.venue.toLowerCase().includes(q) ||
      ev.sport.toLowerCase().includes(q);

    const matchesSport =
      sport === "all" ||
      sport === "all sports" ||
      ev.sport.toLowerCase() === sport;

    const matchesSkill =
      skill === "all" ||
      skill === "all levels" ||
      ev.skill.toLowerCase() === skill;

    const matchesDistance = ev.distanceKm <= maxRadius;

    return matchesSearch && matchesSport && matchesSkill && matchesDistance;
  });

  return filtered.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Concurrency-safe RSVP & Automatic Waitlist Promotion Engine
 */
export async function rsvpToEventConcurrencySafe(
  eventId: number,
  options?: {
    playerName?: string;
    playerKarma?: number;
    allowWaitlist?: boolean;
  }
): Promise<RsvpMutationResult> {
  return withRosterLock(() => {
    const db = getDbState();
    const playerName = options?.playerName || "Alex Morgan (You)";
    const playerKarma = options?.playerKarma ?? 98;
    const allowWaitlist = options?.allowWaitlist ?? true;

    const targetIndex = db.events.findIndex((ev) => ev.id === eventId);
    if (targetIndex === -1) {
      return { status: "not_found", events: db.events };
    }

    const target = db.events[targetIndex];
    const isUserHost = Boolean(
      target.isUserHost || target.host.name.includes("(You)")
    );

    const isInRoster = target.roster.some(
      (p) => p.name === playerName || (playerName.includes("(You)") && p.name.includes("(You)"))
    );
    const isCurrentlyJoined = target.userJoined || isInRoster;

    if (isCurrentlyJoined && isUserHost) {
      if (target.roster.length > 1) {
        return {
          status: "blocked_host_has_teammates",
          event: target,
          events: db.events,
        };
      }
      db.events = db.events.filter((ev) => ev.id !== eventId);
      db.chatChannels = db.chatChannels.filter((c) => c.eventId !== eventId);
      return {
        status: "deleted_solo_host",
        event: target,
        events: db.events,
      };
    }

    // Leaving the event
    if (isCurrentlyJoined) {
      const leavingPlayer = target.roster.find(
        (p) =>
          p.name === playerName ||
          (playerName.includes("(You)") && p.name.includes("(You)"))
      );
      const wasWaitlisted = leavingPlayer?.role === "Waitlist";

      let remainingRoster = target.roster.filter((p) => p !== leavingPlayer);
      let promotedPlayerName: string | undefined;

      // If a confirmed player leaves and someone is on the Waitlist, automatically promote the first waitlisted player
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

      const updatedEvent: EventActivity = {
        ...target,
        userJoined: playerName.includes("(You)") ? false : target.userJoined,
        isUserHost: false,
        confirmedPlayers: nextConfirmedCount,
        roster: remainingRoster,
      };

      db.events[targetIndex] = updatedEvent;

      return {
        status: promotedPlayerName ? "promoted_from_waitlist" : "left",
        event: updatedEvent,
        promotedPlayerName,
        events: db.events,
      };
    }

    // Joining the event: check schedule conflict for self
    if (playerName.includes("(You)")) {
      const conflictingEvent = findConflictingJoinedEvent(target, db.events);
      if (conflictingEvent) {
        return {
          status: "conflict",
          event: target,
          conflictingEvent,
          events: db.events,
        };
      }
    }

    // Concurrency & Capacity check: if full, place on Waitlist
    const isFull = target.confirmedPlayers >= target.maxPlayers;
    if (isFull && !allowWaitlist) {
      return { status: "not_found", event: target, events: db.events };
    }

    const assignedRole = isFull ? "Waitlist" : "Confirmed";
    const nextConfirmedCount = isFull
      ? target.confirmedPlayers
      : target.confirmedPlayers + 1;

    const updatedEvent: EventActivity = {
      ...target,
      userJoined: playerName.includes("(You)") ? true : target.userJoined,
      confirmedPlayers: nextConfirmedCount,
      roster: [
        ...target.roster,
        { name: playerName, role: assignedRole, karma: playerKarma },
      ],
    };

    db.events[targetIndex] = updatedEvent;

    return {
      status: isFull ? "waitlisted" : "joined",
      event: updatedEvent,
      events: db.events,
    };
  });
}

/**
 * Geospatial Venues Query
 */
export function queryVenuesGeospatial(params?: {
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  sport?: string;
}): SportsVenueRecord[] {
  const db = getDbState();
  const maxRadius = params?.radiusKm ?? 25;
  const sport = (params?.sport || "all").toLowerCase();
  const hasCenter =
    typeof params?.centerLat === "number" &&
    Number.isFinite(params.centerLat) &&
    typeof params?.centerLng === "number" &&
    Number.isFinite(params.centerLng);

  return db.venues
    .map((v) => {
      if (!hasCenter) return v;
      return {
        ...v,
        distanceKm: calculateDistanceKm(
          params!.centerLat!,
          params!.centerLng!,
          v.lat,
          v.lng
        ),
      };
    })
    .filter((v) => {
      const matchesSport =
        sport === "all" ||
        sport === "all sports" ||
        v.sports.some((s) => s.toLowerCase() === sport);
      return matchesSport && v.distanceKm <= maxRadius;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Authentication & User Onboarding Operations
 */
export function authenticateUser(
  email: string,
  password?: string
): AuthUserAccount | null {
  const db = getDbState();
  const normalizedEmail = email.trim().toLowerCase();
  const account = db.users.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );
  if (!account) return null;
  if (password && account.passwordHash !== password) {
    return null;
  }
  return account;
}

export function registerUserAccount(input: {
  name: string;
  email: string;
  password?: string;
  username?: string;
  location?: string;
}): { account?: AuthUserAccount; error?: string } {
  const db = getDbState();
  const normalizedEmail = input.email.trim().toLowerCase();
  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return { error: "EMAIL_EXISTS" };
  }

  const rawHandle = (
    input.username ||
    input.name.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "player"
  ).replace(/^@/, "");
  const handle = `@${rawHandle}`;

  const newAccount: AuthUserAccount = {
    id: `usr-${Date.now()}`,
    email: normalizedEmail,
    passwordHash: input.password || "demo123",
    onboardingCompleted: false,
    profile: {
      name: input.name.trim(),
      username: handle,
      location: input.location?.trim() || "Downtown & Metro Area",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces",
      karma: 95,
      tier: "Tier 1 • New Member",
      bio: "Excited to join local games and meet reliable teammates!",
      matchesCount: 0,
      noShowsCount: 0,
      endorsedCount: 0,
      badges: [
        { label: "⏱️ Always Punctual", count: 1 },
        { label: "🤝 Team First", count: 1 },
      ],
      sports: [
        {
          id: Date.now(),
          name: "Soccer",
          icon: "⚽",
          role: "All-Rounder",
          skillTier: "Intermediate",
          verifications: "New Passport",
        },
      ],
      availability: structuredClone(mockUserProfile.availability),
    },
  };

  db.users.push(newAccount);
  return { account: newAccount };
}

export function completeUserOnboarding(
  userIdOrEmail: string,
  payload: {
    location?: string;
    bio?: string;
    sports?: SportPassportItem[];
    availability?: UserProfile["availability"];
  }
): AuthUserAccount | null {
  const db = getDbState();
  const account = db.users.find(
    (u) =>
      u.id === userIdOrEmail ||
      u.email.toLowerCase() === userIdOrEmail.toLowerCase() ||
      u.profile.username.toLowerCase() === userIdOrEmail.toLowerCase()
  );
  if (!account) return null;

  account.onboardingCompleted = true;
  if (payload.location) account.profile.location = payload.location;
  if (payload.bio !== undefined) account.profile.bio = payload.bio;
  if (payload.sports && payload.sports.length > 0) {
    account.profile.sports = payload.sports;
  }
  if (payload.availability && payload.availability.length > 0) {
    account.profile.availability = payload.availability;
  }

  return account;
}
