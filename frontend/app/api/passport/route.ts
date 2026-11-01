import { NextRequest, NextResponse } from "next/server";
import { getDbState } from "@/db/store";
import type { UserProfile } from "@/types/models";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  const db = getDbState();

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
  try {
    const updatedProfile = (await req.json()) as UserProfile;
    const db = getDbState();
    const idx = db.users.findIndex(
      (u) =>
        u.profile.username.toLowerCase() ===
        updatedProfile.username.toLowerCase()
    );
    if (idx !== -1) {
      db.users[idx].profile = updatedProfile;
    } else if (db.users.length > 0) {
      db.users[0].profile = updatedProfile;
    }
    return NextResponse.json({ profile: updatedProfile });
  } catch {
    return NextResponse.json(
      { error: "Invalid passport payload" },
      { status: 400 }
    );
  }
}
