import { NextRequest, NextResponse } from "next/server";
import { getDbState } from "@/db/store";
import { ensurePostgresSynced, pgUpsertUser } from "@/db/postgres";
import type { UserProfile } from "@/types/models";
import { enforceApiRateLimit } from "@/lib/apiSecurity";

export async function GET(req: NextRequest) {
  const rateLimitRes = enforceApiRateLimit(req, "passport:get", {
    windowMs: 60_000,
    maxRequests: 120,
  });
  if (rateLimitRes) return rateLimitRes;

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  const db = await ensurePostgresSynced(getDbState());

  if (username) {
    const normalized = username.replace(/^@/, "").toLowerCase();
    const found = db.users.find(
      (u) => u.profile.username.replace(/^@/, "").toLowerCase() === normalized
    );
    if (found) {
      return NextResponse.json({ profile: found.profile });
    }
  }

  return NextResponse.json({ profile: db.users[0].profile });
}

export async function PUT(req: NextRequest) {
  const rateLimitRes = enforceApiRateLimit(req, "passport:write", {
    windowMs: 60_000,
    maxRequests: 30,
  });
  if (rateLimitRes) return rateLimitRes;

  try {
    const db = await ensurePostgresSynced(getDbState());
    const updatedProfile = (await req.json()) as UserProfile;
    if (!updatedProfile || typeof updatedProfile.username !== "string") {
      return NextResponse.json(
        { error: "Invalid passport payload" },
        { status: 400 }
      );
    }
    const idx = db.users.findIndex(
      (u) =>
        u.profile.username.toLowerCase() ===
        updatedProfile.username.toLowerCase()
    );
    if (idx !== -1) {
      db.users[idx].profile = updatedProfile;
      await pgUpsertUser(db.users[idx]).catch(() => {});
    } else if (db.users.length > 0) {
      db.users[0].profile = updatedProfile;
      await pgUpsertUser(db.users[0]).catch(() => {});
    }
    return NextResponse.json({ profile: updatedProfile });
  } catch {
    return NextResponse.json(
      { error: "Invalid passport payload" },
      { status: 400 }
    );
  }
}
