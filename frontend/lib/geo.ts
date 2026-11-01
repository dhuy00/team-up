import type { EventActivity } from "../types/models";
import { EVENT_OFFSETS, RADAR_REBASE_DISTANCE_KM } from "../constants/radar";

/**
 * Calculates the great-circle distance in kilometers between two coordinates
 * using the Haversine formula, rounded to 1 decimal place.
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Formats a latitude/longitude pair into a compact degree label.
 */
export function formatCoordinatesLabel(lat: number, lng: number): string {
  return `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`;
}

/**
 * Recalculates event distances around a new radar center, optionally rebasing
 * event coordinates if the user jumps to a new city or far-off area.
 */
export function rebaseEventsAroundCenter(
  sourceEvents: EventActivity[],
  newLat: number,
  newLng: number,
  forceRebase = false
): EventActivity[] {
  if (sourceEvents.length === 0) return sourceEvents;

  const firstEv = sourceEvents[0];
  const distFromCluster = calculateDistanceKm(
    newLat,
    newLng,
    firstEv.lat,
    firstEv.lng
  );
  const shouldRebase = forceRebase || distFromCluster > RADAR_REBASE_DISTANCE_KM;

  return sourceEvents.map((ev, idx) => {
    const offset = EVENT_OFFSETS[idx % EVENT_OFFSETS.length];
    const nextLat = shouldRebase ? newLat + offset.lat : ev.lat;
    const nextLng = shouldRebase ? newLng + offset.lng : ev.lng;
    const nextDist = calculateDistanceKm(newLat, newLng, nextLat, nextLng);

    return {
      ...ev,
      lat: nextLat,
      lng: nextLng,
      distanceKm: Math.max(0.3, nextDist),
    };
  });
}
