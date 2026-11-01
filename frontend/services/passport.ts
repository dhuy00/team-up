import type { SportPassportItem, UserProfile } from "../types/models";
import { mockUserProfile } from "../lib/mockData";

export const PASSPORT_STORAGE_KEY = "teamup_user_profile";

/**
 * Pure domain helper to cycle a day's availability slot (`busy` -> `preferred` -> `primary` -> `busy`).
 */
export function computeNextAvailability(
  availability: UserProfile["availability"],
  dayIndex: number,
  labels: {
    busy: string;
    preferred: string;
    primary: string;
  }
): UserProfile["availability"] {
  return availability.map((item, idx) => {
    if (idx !== dayIndex) return item;

    if (item.statusType === "busy") {
      return {
        ...item,
        statusType: "preferred" as const,
        status: labels.preferred,
      };
    }
    if (item.statusType === "preferred") {
      return {
        ...item,
        statusType: "primary" as const,
        status: labels.primary,
      };
    }
    return {
      ...item,
      statusType: "busy" as const,
      status: labels.busy,
    };
  });
}

export function appendSportToProfile(
  profile: UserProfile,
  newSport: SportPassportItem
): UserProfile {
  return {
    ...profile,
    sports: [...profile.sports, newSport],
  };
}

export function removeSportFromProfile(
  profile: UserProfile,
  sportId: number
): UserProfile {
  return {
    ...profile,
    sports: profile.sports.filter((s) => s.id !== sportId),
  };
}

export async function fetchUserProfileAsync(): Promise<UserProfile> {
  if (typeof window === "undefined") return mockUserProfile;
  try {
    const raw = window.localStorage.getItem(PASSPORT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : mockUserProfile;
  } catch {
    return mockUserProfile;
  }
}
