import { NextRequest, NextResponse } from "next/server";
import { getDbState, queryVenuesGeospatial } from "@/db/store";
import {
  enforceApiRateLimit,
  sanitizeGeoQueryParams,
  validateVenuePayload,
} from "@/lib/apiSecurity";

export async function GET(req: NextRequest) {
  const rateLimitRes = enforceApiRateLimit(req, "venues:get", {
    windowMs: 60_000,
    maxRequests: 120,
  });
  if (rateLimitRes) return rateLimitRes;

  const { searchParams } = new URL(req.url);
  const query = sanitizeGeoQueryParams(searchParams);

  const venues = queryVenuesGeospatial({
    sport: query.sport,
    radiusKm: query.radiusKm,
    centerLat: query.centerLat,
    centerLng: query.centerLng,
  });

  return NextResponse.json({ venues });
}

export async function POST(req: NextRequest) {
  const rateLimitRes = enforceApiRateLimit(req, "venues:write", {
    windowMs: 60_000,
    maxRequests: 25,
  });
  if (rateLimitRes) return rateLimitRes;

  try {
    const raw = await req.json();
    const validation = validateVenuePayload(raw);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { error: validation.error || "Invalid venue payload" },
        { status: 400 }
      );
    }

    const db = getDbState();
    const newVenue = {
      id: Date.now(),
      ...validation.data,
      distanceKm: 1.2,
      verified: false,
    };
    db.venues = [newVenue, ...db.venues];
    return NextResponse.json(
      { venue: newVenue, venues: db.venues },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid venue payload" },
      { status: 400 }
    );
  }
}
