import { NextRequest, NextResponse } from "next/server";
import { getDbState } from "@/db/store";
import { filterSquadsList } from "@/services/squads";
import { enforceApiRateLimit, validateSquadPayload } from "@/lib/apiSecurity";

export async function GET(req: NextRequest) {
  const rateLimitRes = enforceApiRateLimit(req, "squads:get", {
    windowMs: 60_000,
    maxRequests: 120,
  });
  if (rateLimitRes) return rateLimitRes;

  const { searchParams } = new URL(req.url);
  const sport = (searchParams.get("sport") || "all").trim().slice(0, 40);
  const q = (searchParams.get("q") || "").trim().slice(0, 120);
  const db = getDbState();

  const squads = filterSquadsList(db.squads, {
    sport,
    searchQuery: q,
  });

  return NextResponse.json({
    squads,
    requestedSquadIds: db.requestedSquadIds,
  });
}

export async function POST(req: NextRequest) {
  const rateLimitRes = enforceApiRateLimit(req, "squads:write", {
    windowMs: 60_000,
    maxRequests: 30,
  });
  if (rateLimitRes) return rateLimitRes;

  try {
    const raw = await req.json();
    const validation = validateSquadPayload(raw);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { error: validation.error || "Invalid squad payload" },
        { status: 400 }
      );
    }

    const db = getDbState();

    if (validation.data.kind === "toggle_invite") {
      const { squadId } = validation.data;
      const exists = db.requestedSquadIds.includes(squadId);
      db.requestedSquadIds = exists
        ? db.requestedSquadIds.filter((id) => id !== squadId)
        : [...db.requestedSquadIds, squadId];
      return NextResponse.json({
        requested: !exists,
        requestedSquadIds: db.requestedSquadIds,
      });
    }

    const newSquad = validation.data.squad;
    db.squads = [newSquad, ...db.squads];
    if (!db.requestedSquadIds.includes(newSquad.id)) {
      db.requestedSquadIds.push(newSquad.id);
    }
    return NextResponse.json(
      { squad: newSquad, squads: db.squads },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid squad payload" },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const rateLimitRes = enforceApiRateLimit(req, "squads:write", {
    windowMs: 60_000,
    maxRequests: 30,
  });
  if (rateLimitRes) return rateLimitRes;

  try {
    const raw = await req.json();
    const validation = validateSquadPayload(raw);
    if (
      !validation.valid ||
      !validation.data ||
      validation.data.kind !== "squad"
    ) {
      return NextResponse.json(
        { error: validation.error || "Invalid squad payload" },
        { status: 400 }
      );
    }

    const updatedSquad = validation.data.squad;
    const db = getDbState();
    db.squads = db.squads.map((sq) =>
      sq.id === updatedSquad.id ? updatedSquad : sq
    );
    return NextResponse.json({ squad: updatedSquad, squads: db.squads });
  } catch {
    return NextResponse.json(
      { error: "Invalid squad payload" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const rateLimitRes = enforceApiRateLimit(req, "squads:write", {
    windowMs: 60_000,
    maxRequests: 30,
  });
  if (rateLimitRes) return rateLimitRes;

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid squad ID" }, { status: 400 });
  }
  const db = getDbState();
  db.squads = db.squads.filter((sq) => sq.id !== id);
  db.requestedSquadIds = db.requestedSquadIds.filter((sqId) => sqId !== id);
  db.chatChannels = db.chatChannels.filter((c) => c.squadId !== id);
  return NextResponse.json({ squads: db.squads });
}
