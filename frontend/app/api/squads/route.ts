import { NextRequest, NextResponse } from "next/server";
import { getDbState } from "@/db/store";
import { filterSquadsList } from "@/services/squads";
import type { TeamSquad } from "@/types/models";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport") || "all";
  const q = searchParams.get("q") || "";
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
  try {
    const body = await req.json();
    const db = getDbState();

    if (body.action === "toggle_invite" && typeof body.squadId === "number") {
      const exists = db.requestedSquadIds.includes(body.squadId);
      db.requestedSquadIds = exists
        ? db.requestedSquadIds.filter((id) => id !== body.squadId)
        : [...db.requestedSquadIds, body.squadId];
      return NextResponse.json({
        requested: !exists,
        requestedSquadIds: db.requestedSquadIds,
      });
    }

    const newSquad = body as TeamSquad;
    db.squads = [newSquad, ...db.squads];
    if (!db.requestedSquadIds.includes(newSquad.id)) {
      db.requestedSquadIds.push(newSquad.id);
    }
    return NextResponse.json({ squad: newSquad, squads: db.squads }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid squad payload" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const updatedSquad = (await req.json()) as TeamSquad;
    const db = getDbState();
    db.squads = db.squads.map((sq) =>
      sq.id === updatedSquad.id ? updatedSquad : sq
    );
    return NextResponse.json({ squad: updatedSquad, squads: db.squads });
  } catch {
    return NextResponse.json({ error: "Invalid squad payload" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  const db = getDbState();
  db.squads = db.squads.filter((sq) => sq.id !== id);
  db.requestedSquadIds = db.requestedSquadIds.filter((sqId) => sqId !== id);
  db.chatChannels = db.chatChannels.filter((c) => c.squadId !== id);
  return NextResponse.json({ squads: db.squads });
}
