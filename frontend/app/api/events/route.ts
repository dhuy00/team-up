import { NextRequest, NextResponse } from "next/server";
import { getDbState, queryEventsGeospatial } from "@/db/store";
import {
  ensurePostgresSynced,
  pgDeleteEvent,
  pgUpsertEvent,
} from "@/db/postgres";
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

  await ensurePostgresSynced(getDbState());

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
    const db = await ensurePostgresSynced(getDbState());
    const raw = await req.json();
    const validation = validateEventPayload(raw);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { error: validation.error || "Invalid event payload" },
        { status: 400 }
      );
    }

    const newEvent = validation.data;
    if (!db.events.some((ev) => ev.id === newEvent.id)) {
      db.events = [newEvent, ...db.events];
    }
    await pgUpsertEvent(newEvent).catch(() => {});
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
    const db = await ensurePostgresSynced(getDbState());
    const raw = await req.json();
    const validation = validateEventPayload(raw);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { error: validation.error || "Invalid event payload" },
        { status: 400 }
      );
    }

    const updatedEvent = validation.data;
    db.events = db.events.map((ev) =>
      ev.id === updatedEvent.id ? updatedEvent : ev
    );
    await pgUpsertEvent(updatedEvent).catch(() => {});
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

  const db = await ensurePostgresSynced(getDbState());
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }
  db.events = db.events.filter((ev) => ev.id !== id);
  db.chatChannels = db.chatChannels.filter((c) => c.eventId !== id);
  await pgDeleteEvent(id).catch(() => {});
  return NextResponse.json({ events: db.events });
}
