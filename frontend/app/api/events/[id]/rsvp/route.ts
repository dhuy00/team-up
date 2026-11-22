import { NextRequest, NextResponse } from "next/server";
import { getDbState, rsvpToEventConcurrencySafe } from "@/db/store";
import { computeTransferEventHost } from "@/services/events";
import { enforceApiRateLimit } from "@/lib/apiSecurity";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const rateLimitRes = enforceApiRateLimit(req, "events:rsvp", {
    windowMs: 60_000,
    maxRequests: 40,
  });
  if (rateLimitRes) return rateLimitRes;

  const { id } = await context.params;
  const eventId = Number(id);
  if (!Number.isFinite(eventId)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    if (body.action === "transfer_host" && body.newHostName) {
      const db = getDbState();
      db.events = computeTransferEventHost(
        db.events,
        eventId,
        String(body.newHostName).trim()
      );
      const updated = db.events.find((ev) => ev.id === eventId);
      return NextResponse.json({
        status: "host_transferred",
        event: updated,
        events: db.events,
      });
    }

    const result = await rsvpToEventConcurrencySafe(eventId, {
      playerName:
        typeof body.playerName === "string"
          ? body.playerName.trim().slice(0, 80)
          : undefined,
      playerKarma:
        typeof body.playerKarma === "number" ? body.playerKarma : undefined,
      allowWaitlist: body.allowWaitlist ?? true,
    });

    if (result.status === "conflict") {
      return NextResponse.json(result, { status: 409 });
    }
    if (result.status === "blocked_host_has_teammates") {
      return NextResponse.json(result, { status: 403 });
    }
    if (result.status === "not_found") {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "RSVP operation failed" },
      { status: 500 }
    );
  }
}
