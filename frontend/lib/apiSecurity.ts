import type { NextRequest } from "next/server";
import type { EventActivity, TeamSquad } from "../types/models";
import { EVENT_CAPACITY_CONFIG } from "../constants/explore";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAtMs: number;
  retryAfterSec: number;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60_000, // 1 minute window
  maxRequests: 60,
};

// Sliding-window request log keyed by `${bucketKey}:${clientId}`
const rateLimitStore = new Map<string, number[]>();

export function resetRateLimiterForTests(): void {
  rateLimitStore.clear();
}

export function extractClientIdentifier(
  req: NextRequest | Request | { headers: Headers }
): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim() || "anon";
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "local-client";
}

export function checkRateLimit(
  clientId: string,
  bucketKey: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT,
  nowMs = Date.now()
): RateLimitResult {
  const key = `${bucketKey}:${clientId}`;
  const windowStart = nowMs - config.windowMs;
  const previousTimestamps = rateLimitStore.get(key) || [];
  const activeTimestamps = previousTimestamps.filter((ts) => ts > windowStart);

  if (activeTimestamps.length >= config.maxRequests) {
    const oldestInWindow = activeTimestamps[0] || nowMs;
    const resetAtMs = oldestInWindow + config.windowMs;
    const retryAfterSec = Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000));
    rateLimitStore.set(key, activeTimestamps);
    return {
      allowed: false,
      remaining: 0,
      resetAtMs,
      retryAfterSec,
    };
  }

  activeTimestamps.push(nowMs);
  rateLimitStore.set(key, activeTimestamps);

  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - activeTimestamps.length),
    resetAtMs: nowMs + config.windowMs,
    retryAfterSec: 0,
  };
}

export function enforceApiRateLimit(
  req: NextRequest | Request | { headers: Headers },
  bucketKey: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): Response | null {
  const clientId = extractClientIdentifier(req);
  const res = checkRateLimit(clientId, bucketKey, config);
  if (!res.allowed) {
    return Response.json(
      {
        error: "Rate limit exceeded. Please slow down and try again shortly.",
        retryAfterSec: res.retryAfterSec,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(res.retryAfterSec),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }
  return null;
}

export interface ValidationOutcome<T> {
  valid: boolean;
  error?: string;
  data?: T;
}

export function sanitizeGeoQueryParams(searchParams: URLSearchParams): {
  sport: string;
  skill: string;
  q: string;
  radiusKm: number;
  centerLat?: number;
  centerLng?: number;
} {
  const sport = (searchParams.get("sport") || "all").trim().slice(0, 40);
  const skill = (searchParams.get("skill") || "all").trim().slice(0, 40);
  const q = (searchParams.get("q") || "").trim().slice(0, 120);

  const rawRadius = Number(searchParams.get("radius"));
  const radiusKm = Number.isFinite(rawRadius) && rawRadius > 0
    ? Math.min(100, Math.max(1, rawRadius))
    : 25;

  const rawLat = searchParams.get("lat");
  const parsedLat = rawLat !== null ? Number(rawLat) : undefined;
  const centerLat =
    parsedLat !== undefined &&
    Number.isFinite(parsedLat) &&
    parsedLat >= -90 &&
    parsedLat <= 90
      ? parsedLat
      : undefined;

  const rawLng = searchParams.get("lng");
  const parsedLng = rawLng !== null ? Number(rawLng) : undefined;
  const centerLng =
    parsedLng !== undefined &&
    Number.isFinite(parsedLng) &&
    parsedLng >= -180 &&
    parsedLng <= 180
      ? parsedLng
      : undefined;

  return { sport, skill, q, radiusKm, centerLat, centerLng };
}

export function validateEventPayload(
  payload: unknown
): ValidationOutcome<EventActivity> {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Event payload must be a JSON object" };
  }

  const candidate = payload as Partial<EventActivity>;
  if (typeof candidate.id !== "number" || !Number.isFinite(candidate.id)) {
    return { valid: false, error: "Event id must be a valid number" };
  }

  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  if (!title || title.length > 140) {
    return {
      valid: false,
      error: "Event title is required and must be at most 140 characters",
    };
  }

  const sport = typeof candidate.sport === "string" ? candidate.sport.trim() : "";
  if (!sport) {
    return { valid: false, error: "Event sport is required" };
  }

  const venue = typeof candidate.venue === "string" ? candidate.venue.trim() : "";
  if (!venue) {
    return { valid: false, error: "Event venue is required" };
  }

  const maxPlayers = Number(candidate.maxPlayers);
  if (
    !Number.isInteger(maxPlayers) ||
    maxPlayers < EVENT_CAPACITY_CONFIG.MIN ||
    maxPlayers > EVENT_CAPACITY_CONFIG.MAX
  ) {
    return {
      valid: false,
      error: `maxPlayers must be an integer between ${EVENT_CAPACITY_CONFIG.MIN} and ${EVENT_CAPACITY_CONFIG.MAX}`,
    };
  }

  const confirmedPlayers = Number(candidate.confirmedPlayers ?? 1);
  if (
    !Number.isInteger(confirmedPlayers) ||
    confirmedPlayers < 0 ||
    confirmedPlayers > maxPlayers
  ) {
    return {
      valid: false,
      error: "confirmedPlayers must be between 0 and maxPlayers",
    };
  }

  const lat = Number(candidate.lat ?? 37.7749);
  const lng = Number(candidate.lng ?? -122.4194);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { valid: false, error: "Invalid latitude coordinate" };
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { valid: false, error: "Invalid longitude coordinate" };
  }

  if (
    candidate.minKarmaRequired !== undefined &&
    (typeof candidate.minKarmaRequired !== "number" ||
      candidate.minKarmaRequired < 0 ||
      candidate.minKarmaRequired > 100)
  ) {
    return {
      valid: false,
      error: "minKarmaRequired must be between 0 and 100",
    };
  }

  return {
    valid: true,
    data: {
      ...(candidate as EventActivity),
      title,
      sport,
      venue,
      maxPlayers,
      confirmedPlayers,
      lat,
      lng,
    },
  };
}

export function validateSquadPayload(
  payload: unknown
): ValidationOutcome<
  | { kind: "toggle_invite"; squadId: number }
  | { kind: "squad"; squad: TeamSquad }
> {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Squad payload must be a JSON object" };
  }

  const obj = payload as Record<string, unknown>;
  if (obj.action === "toggle_invite") {
    if (typeof obj.squadId !== "number" || !Number.isFinite(obj.squadId)) {
      return { valid: false, error: "squadId must be a valid number" };
    }
    return {
      valid: true,
      data: { kind: "toggle_invite", squadId: obj.squadId },
    };
  }

  const candidate = payload as Partial<TeamSquad>;
  if (typeof candidate.id !== "number" || !Number.isFinite(candidate.id)) {
    return { valid: false, error: "Squad id must be a valid number" };
  }

  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  if (!name || name.length > 100) {
    return {
      valid: false,
      error: "Squad name is required and must be at most 100 characters",
    };
  }

  const maxMembers = Number(candidate.maxMembers ?? 20);
  if (!Number.isInteger(maxMembers) || maxMembers < 2 || maxMembers > 500) {
    return {
      valid: false,
      error: "Squad maxMembers must be an integer between 2 and 500",
    };
  }

  return {
    valid: true,
    data: {
      kind: "squad",
      squad: {
        ...(candidate as TeamSquad),
        name,
        maxMembers,
      },
    },
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthPayload(
  payload: unknown
): ValidationOutcome<Record<string, unknown>> {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Auth payload must be a JSON object" };
  }

  const obj = payload as Record<string, unknown>;
  const action = obj.action;
  if (action !== "login" && action !== "register" && action !== "onboarding") {
    return { valid: false, error: "Unsupported auth action" };
  }

  if (action === "login" || action === "register") {
    const email = typeof obj.email === "string" ? obj.email.trim() : "";
    if (!email || !EMAIL_REGEX.test(email)) {
      return { valid: false, error: "A valid email address is required" };
    }
  }

  if (action === "register") {
    const name = typeof obj.name === "string" ? obj.name.trim() : "";
    if (!name || name.length > 80) {
      return { valid: false, error: "Full name is required for registration" };
    }
  }

  return { valid: true, data: obj };
}

export function validateVenuePayload(payload: unknown): ValidationOutcome<{
  name: string;
  address: string;
  sports: string[];
  lat: number;
  lng: number;
}> {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Venue payload must be a JSON object" };
  }

  const obj = payload as Record<string, unknown>;
  const name = typeof obj.name === "string" ? obj.name.trim() : "";
  if (!name || name.length > 120) {
    return { valid: false, error: "Venue name is required" };
  }

  const address =
    typeof obj.address === "string" && obj.address.trim()
      ? obj.address.trim()
      : "Metro District";
  const sports =
    Array.isArray(obj.sports) && obj.sports.length > 0
      ? obj.sports.map((s) => String(s))
      : ["Soccer"];
  const lat = typeof obj.lat === "number" ? obj.lat : 37.775;
  const lng = typeof obj.lng === "number" ? obj.lng : -122.419;

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { valid: false, error: "Invalid venue latitude" };
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { valid: false, error: "Invalid venue longitude" };
  }

  return {
    valid: true,
    data: { name, address, sports, lat, lng },
  };
}
