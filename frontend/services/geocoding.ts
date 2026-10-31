import { GeoCoordinates } from "@/types/models";

export interface GeocodingSearchResult extends GeoCoordinates {
  displayName: string;
}

interface NominatimResponseItem {
  lat: string;
  lon: string;
  display_name?: string;
}

/**
 * Queries OpenStreetMap Nominatim for a city, district, or venue name.
 */
export async function searchLocationNominatim(
  query: string
): Promise<GeocodingSearchResult | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=1`
  );
  const results = (await response.json()) as NominatimResponseItem[];

  if (Array.isArray(results) && results.length > 0) {
    const targetLat = parseFloat(results[0].lat);
    const targetLng = parseFloat(results[0].lon);
    const displayName =
      results[0].display_name?.split(",").slice(0, 2).join(", ") || query;

    return {
      lat: targetLat,
      lng: targetLng,
      displayName,
    };
  }

  return null;
}

/**
 * Requests the user's current browser geolocation coordinates.
 */
export function getBrowserCoordinates(): Promise<GeoCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        reject(err);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}
