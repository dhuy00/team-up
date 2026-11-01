import { NextRequest, NextResponse } from "next/server";
import { getDbState, queryVenuesGeospatial } from "@/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport") || "all";
  const radius = searchParams.get("radius")
    ? Number(searchParams.get("radius"))
    : 25;
  const lat = searchParams.get("lat")
    ? Number(searchParams.get("lat"))
    : undefined;
  const lng = searchParams.get("lng")
    ? Number(searchParams.get("lng"))
    : undefined;

  const venues = queryVenuesGeospatial({
    sport,
    radiusKm: Number.isFinite(radius) ? radius : 25,
    centerLat: lat,
    centerLng: lng,
  });

  return NextResponse.json({ venues });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDbState();
    const newVenue = {
      id: Date.now(),
      name: body.name || "Community Sports Court",
      address: body.address || "Metro District",
      sports: Array.isArray(body.sports) ? body.sports : ["Soccer"],
      lat: typeof body.lat === "number" ? body.lat : 37.775,
      lng: typeof body.lng === "number" ? body.lng : -122.419,
      distanceKm: 1.2,
      verified: false,
    };
    db.venues = [newVenue, ...db.venues];
    return NextResponse.json({ venue: newVenue, venues: db.venues }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid venue payload" }, { status: 400 });
  }
}
