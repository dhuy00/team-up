import type { TeamSquad } from "../types/models";
import { initialSquads } from "../lib/mockData";

export const SQUADS_STORAGE_KEY = "teamup_squads";
export const REQUESTED_SQUADS_STORAGE_KEY = "teamup_requested_squads";

/**
 * Filters squads by search query and sport category.
 */
export function filterSquadsList(
  squads: TeamSquad[],
  filters: {
    sport: string;
    searchQuery: string;
  }
): TeamSquad[] {
  const q = filters.searchQuery.trim().toLowerCase();
  return squads.filter((sq) => {
    const matchesSearch =
      q === "" ||
      sq.name.toLowerCase().includes(q) ||
      sq.sport.toLowerCase().includes(q) ||
      sq.venue.toLowerCase().includes(q) ||
      sq.description.toLowerCase().includes(q);

    const matchesSport =
      filters.sport === "all" ||
      sq.sport.toLowerCase().includes(filters.sport.toLowerCase());

    return matchesSearch && matchesSport;
  });
}

/**
 * Normalizes legacy squad sport names and card variants.
 */
export function normalizeLegacySquads(squads: TeamSquad[]): {
  changed: boolean;
  squads: TeamSquad[];
} {
  const changed = squads.some(
    (sq) =>
      sq.sport === "Badminton Club" ||
      sq.sport === "Tabletop Collective" ||
      Boolean(sq.featuredBadge) ||
      sq.variant !== "white"
  );

  if (!changed) {
    return { changed: false, squads };
  }

  const normalized = squads.map((sq) => {
    let normalizedSport = sq.sport;
    if (sq.sport === "Badminton Club") normalizedSport = "Badminton";
    if (sq.sport === "Tabletop Collective") normalizedSport = "Board Games";
    const next: TeamSquad = {
      ...sq,
      sport: normalizedSport,
      variant: "white",
    };
    delete next.featuredBadge;
    return next;
  });

  return { changed: true, squads: normalized };
}

export async function fetchSquadsAsync(): Promise<TeamSquad[]> {
  if (typeof window === "undefined") return initialSquads;
  try {
    const raw = window.localStorage.getItem(SQUADS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TeamSquad[]) : initialSquads;
  } catch {
    return initialSquads;
  }
}
