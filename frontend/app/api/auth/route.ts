import { NextRequest, NextResponse } from "next/server";
import {
  authenticateUser,
  completeUserOnboarding,
  getDbState,
  registerUserAccount,
} from "@/db/store";
import { enforceApiRateLimit, validateAuthPayload } from "@/lib/apiSecurity";

export async function GET(req: NextRequest) {
  const rateLimitRes = enforceApiRateLimit(req, "auth:get", {
    windowMs: 60_000,
    maxRequests: 60,
  });
  if (rateLimitRes) return rateLimitRes;

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
  const rateLimitRes = enforceApiRateLimit(req, "auth:write", {
    windowMs: 60_000,
    maxRequests: 20,
  });
  if (rateLimitRes) return rateLimitRes;

  try {
    const raw = await req.json();
    const validation = validateAuthPayload(raw);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { error: validation.error || "Invalid auth payload" },
        { status: 400 }
      );
    }

    const body = validation.data;
    const { action } = body;

    if (action === "login") {
      const account = authenticateUser(
        String(body.email || ""),
        typeof body.password === "string" ? body.password : undefined
      );
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
        name: String(body.name || "New Player"),
        email: String(body.email || ""),
        password:
          typeof body.password === "string" && body.password
            ? body.password
            : "demo123",
        username:
          typeof body.username === "string" ? body.username : undefined,
        location:
          typeof body.location === "string" ? body.location : undefined,
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
      const updated = completeUserOnboarding(
        String(body.userId || body.email || ""),
        {
          location:
            typeof body.location === "string" ? body.location : undefined,
          bio: typeof body.bio === "string" ? body.bio : undefined,
          sports: Array.isArray(body.sports) ? body.sports : undefined,
          availability: Array.isArray(body.availability)
            ? body.availability
            : undefined,
        }
      );
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
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 }
    );
  }
}
