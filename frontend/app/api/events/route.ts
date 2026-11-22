import { NextRequest, NextResponse } from "next/server";
import { getDbState, queryEventsGeospatial } from "@/db/store";
import {
  enforceApiRateLimit,
  sanitizeGeoQueryParams,
  validateEventPayload,
} from "@/lib/apiSecurity";

export async function GET(req: NextRequest) {
  const rateLimitRes = enforceApiRateLimit(req, "events:get", {
    windowMs: 60_000,
    maxRequests: 120,
  });
  if (rateLimitRes) return rateLimitRes;

  const { searchParams } = new URL(req.url);
  const query = sanitizeGeoQueryParams(searchParams);

  const events = queryEventsGeospatial({
    sport: query.sport,
    skill: query.skill,
    radiusKm: query.radiusKm,
    centerLat: query.centerLat,
    centerLng: query.centerLng,
    q: query.q,
  });

  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const rateLimitRes = enforceApiRateLimit(req, "events:write", {
    windowMs: 60_000,
    maxRequests: 30,
  });
  if (rateLimitRes) return rateLimitRes;

  try {
    const raw = await req.json();
    const validation = validateEventPayload(raw);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { error: validation.error || "Invalid event payload" },
        { status: 400 }
      );
    }

    const newEvent = validation.data;
    const db = getDbState();
    if (!db.events.some((ev) => ev.id === newEvent.id)) {
      db.events = [newEvent, ...db.events];
    }
    return NextResponse.json(
      { event: newEvent, events: db.events },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid event payload" },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const rateLimitRes = enforceApiRateLimit(req, "events:write", {
    windowMs: 60_000,
    maxRequests: 30,
  });
  if (rateLimitRes) return rateLimitRes;

  try {
    const raw = await req.json();
    const validation = validateEventPayload(raw);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { error: validation.error || "Invalid event payload" },
        { status: 400 }
      );
    }

    const updatedEvent = validation.data;
    const db = getDbState();
    db.events = db.events.map((ev) =>
      ev.id === updatedEvent.id ? updatedEvent : ev
    );
    return NextResponse.json({ event: updatedEvent, events: db.events });
  } catch {
    return NextResponse.json(
      { error: "Invalid event payload" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const rateLimitRes = enforceApiRateLimit(req, "events:write", {
    windowMs: 60_000,
    maxRequests: 30,
  });
  if (rateLimitRes) return rateLimitRes;

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }
  const db = getDbState();
  db.events = db.events.filter((ev) => ev.id !== id);
  db.chatChannels = db.chatChannels.filter((c) => c.eventId !== id);
  return NextResponse.json({ events: db.events });
}
