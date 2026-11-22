import type { EventActivity } from "../types/models";
import { calculateDistanceKm } from "./geo";

export interface EventClusterNode {
  id: string;
  isCluster: boolean;
  lat: number;
  lng: number;
  events: EventActivity[];
  totalConfirmed: number;
  totalCapacity: number;
}

/**
 * Returns the clustering radius (in kilometers) for a given Leaflet zoom level.
 * - At high zoom (>= 16): 0.025 km (~25m), grouping only co-located matches at the same venue.
 * - At mid zoom (13-15): scales from ~0.35 km down to ~0.08 km.
 * - At low zoom (<= 12): scales exponentially so metropolitan areas stay clutter-free.
 */
export function getClusterRadiusKmForZoom(zoom: number): number {
  const safeZoom = Number.isFinite(zoom) ? zoom : 13;
  if (safeZoom >= 16) return 0.025;
  if (safeZoom === 15) return 0.08;
  if (safeZoom === 14) return 0.18;
  if (safeZoom === 13) return 0.35;
  return Number((0.7 * Math.pow(1.85, 12 - safeZoom)).toFixed(3));
}

/**
 * Greedy distance-based spatial clustering for EventActivity pins.
 * Scales smoothly to hundreds of concurrent matches without external DOM plugins.
 */
export function clusterEventsByZoom(
  events: EventActivity[],
  zoom = 13
): EventClusterNode[] {
  if (!events || events.length === 0) return [];

  const radiusKm = getClusterRadiusKmForZoom(zoom);
  const visited = new Set<number>();
  const clusters: EventClusterNode[] = [];

  for (let i = 0; i < events.length; i++) {
    const seed = events[i];
    if (visited.has(seed.id)) continue;

    visited.add(seed.id);
    const group: EventActivity[] = [seed];

    for (let j = i + 1; j < events.length; j++) {
      const candidate = events[j];
      if (visited.has(candidate.id)) continue;

      const dist = calculateDistanceKm(
        seed.lat,
        seed.lng,
        candidate.lat,
        candidate.lng
      );
      if (dist <= radiusKm) {
        visited.add(candidate.id);
        group.push(candidate);
      }
    }

    const sumLat = group.reduce((acc, ev) => acc + ev.lat, 0);
    const sumLng = group.reduce((acc, ev) => acc + ev.lng, 0);
    const totalConfirmed = group.reduce(
      (acc, ev) => acc + ev.confirmedPlayers,
      0
    );
    const totalCapacity = group.reduce((acc, ev) => acc + ev.maxPlayers, 0);

    clusters.push({
      id:
        group.length === 1
          ? `pin-${seed.id}`
          : `cluster-${group.map((e) => e.id).join("-")}`,
      isCluster: group.length > 1,
      lat: Number((sumLat / group.length).toFixed(6)),
      lng: Number((sumLng / group.length).toFixed(6)),
      events: group,
      totalConfirmed,
      totalCapacity,
    });
  }

  return clusters;
}
