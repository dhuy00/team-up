import { NextRequest, NextResponse } from "next/server";
import { getDbState, queryEventsGeospatial } from "@/db/store";
import type { EventActivity } from "@/types/models";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport") || "all";
  const skill = searchParams.get("skill") || "all";
  const q = searchParams.get("q") || "";
  const radius = searchParams.get("radius")
    ? Number(searchParams.get("radius"))
    : 25;
  const lat = searchParams.get("lat")
    ? Number(searchParams.get("lat"))
    : undefined;
  const lng = searchParams.get("lng")
    ? Number(searchParams.get("lng"))
    : undefined;

  const events = queryEventsGeospatial({
    sport,
    skill,
    radiusKm: Number.isFinite(radius) ? radius : 25,
    centerLat: lat,
    centerLng: lng,
    q,
  });

  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  try {
    const newEvent = (await req.json()) as EventActivity;
    const db = getDbState();
    if (!db.events.some((ev) => ev.id === newEvent.id)) {
      db.events = [newEvent, ...db.events];
    }
    return NextResponse.json({ event: newEvent, events: db.events }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const updatedEvent = (await req.json()) as EventActivity;
    const db = getDbState();
    db.events = db.events.map((ev) =>
      ev.id === updatedEvent.id ? updatedEvent : ev
    );
    return NextResponse.json({ event: updatedEvent, events: db.events });
  } catch {
    return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  const db = getDbState();
  db.events = db.events.filter((ev) => ev.id !== id);
  db.chatChannels = db.chatChannels.filter((c) => c.eventId !== id);
  return NextResponse.json({ events: db.events });
}
