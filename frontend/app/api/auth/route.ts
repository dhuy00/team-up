import { NextRequest, NextResponse } from "next/server";
import {
  authenticateUser,
  completeUserOnboarding,
  getDbState,
  registerUserAccount,
} from "@/db/store";

export async function GET() {
  const db = getDbState();
  const accounts = db.users.map((u) => ({
    id: u.id,
    email: u.email,
    onboardingCompleted: u.onboardingCompleted,
    profile: u.profile,
  }));
  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "login") {
      const account = authenticateUser(body.email || "", body.password);
      if (!account) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }
      return NextResponse.json({
        user: {
          id: account.id,
          email: account.email,
          onboardingCompleted: account.onboardingCompleted,
          profile: account.profile,
        },
      });
    }

    if (action === "register") {
      const result = registerUserAccount({
        name: body.name || "New Player",
        email: body.email || "",
        password: body.password || "demo123",
        username: body.username,
        location: body.location,
      });
      if (result.error || !result.account) {
        return NextResponse.json(
          { error: result.error || "Registration failed" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          user: {
            id: result.account.id,
            email: result.account.email,
            onboardingCompleted: result.account.onboardingCompleted,
            profile: result.account.profile,
          },
        },
        { status: 201 }
      );
    }

    if (action === "onboarding") {
      const updated = completeUserOnboarding(body.userId || body.email || "", {
        location: body.location,
        bio: body.bio,
        sports: body.sports,
        availability: body.availability,
      });
      if (!updated) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json({
        user: {
          id: updated.id,
          email: updated.email,
          onboardingCompleted: updated.onboardingCompleted,
          profile: updated.profile,
        },
      });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
