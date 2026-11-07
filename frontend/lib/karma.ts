import type {
  AttendanceStatus,
  EventActivity,
  UserProfile,
} from "../types/models";

export const KARMA_RULES = {
  SHOWED_UP_DELTA: 1,
  LATE_DELTA: -3,
  NO_SHOW_DELTA: -10,
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  TIER_1_MIN: 95,
  TIER_2_MIN: 80,
} as const;

export const FAIR_PLAY_BADGE_OPTIONS = [
  "⏱️ Always Punctual",
  "🤝 Team First",
  "🌟 Great Sport",
] as const;

export const KARMA_GATE_THRESHOLDS = [0, 85, 90, 95] as const;

export function computeKarmaDelta(status: AttendanceStatus): number {
  switch (status) {
    case "showed_up":
      return KARMA_RULES.SHOWED_UP_DELTA;
    case "late":
      return KARMA_RULES.LATE_DELTA;
    case "no_show":
      return KARMA_RULES.NO_SHOW_DELTA;
  }
}

export function computeNextKarmaScore(
  currentKarma: number,
  status: AttendanceStatus
): number {
  const raw = currentKarma + computeKarmaDelta(status);
  return Math.min(
    KARMA_RULES.MAX_SCORE,
    Math.max(KARMA_RULES.MIN_SCORE, Math.round(raw))
  );
}

export function computeKarmaTier(karma: number): string {
  if (karma >= KARMA_RULES.TIER_1_MIN) {
    return "Tier 1";
  }
  if (karma >= KARMA_RULES.TIER_2_MIN) {
    return "Verified";
  }
  return "Probation";
}

export function canPlayerInstantJoin(
  playerKarma: number,
  minKarmaRequired?: number
): boolean {
  if (!minKarmaRequired || minKarmaRequired <= 0) return true;
  return playerKarma >= minKarmaRequired;
}

export function applyPostMatchCheckInToEvent(
  event: EventActivity,
  attendanceByPlayerName: Record<string, AttendanceStatus>
): EventActivity {
  const updatedRoster = event.roster.map((player) => {
    const status = attendanceByPlayerName[player.name] || "showed_up";
    return {
      ...player,
      attendance: status,
      karma: computeNextKarmaScore(player.karma, status),
    };
  });

  const hostStatus = attendanceByPlayerName[event.host.name];
  const updatedHost = hostStatus
    ? {
        ...event.host,
        karma: computeNextKarmaScore(event.host.karma, hostStatus),
      }
    : event.host;

  return {
    ...event,
    completedCheckIn: true,
    host: updatedHost,
    roster: updatedRoster,
  };
}

export function applyPostMatchCheckInToProfile(
  profile: UserProfile,
  params: {
    selfAttendance: AttendanceStatus;
    badgesAwarded: string[];
    endorseSportName?: string;
  }
): UserProfile {
  const nextKarma = computeNextKarmaScore(
    profile.karma,
    params.selfAttendance
  );
  const nextTier = computeKarmaTier(nextKarma);
  const nextNoShows =
    params.selfAttendance === "no_show"
      ? profile.noShowsCount + 1
      : profile.noShowsCount;
  const nextMatchesCount =
    params.selfAttendance === "no_show"
      ? profile.matchesCount
      : profile.matchesCount + 1;

  const badgeSet = new Set(params.badgesAwarded);
  const existingLabels = new Set(profile.badges.map((b) => b.label));
  const updatedBadges = profile.badges.map((b) =>
    badgeSet.has(b.label) ? { ...b, count: b.count + 1 } : b
  );
  for (const awarded of params.badgesAwarded) {
    if (!existingLabels.has(awarded)) {
      updatedBadges.push({ label: awarded, count: 1 });
    }
  }

  const nextEndorsedCount =
    profile.endorsedCount + params.badgesAwarded.length;

  const updatedSports = params.endorseSportName
    ? profile.sports.map((sp) => {
        if (
          sp.name.toLowerCase().includes(params.endorseSportName!.toLowerCase()) ||
          params.endorseSportName!.toLowerCase().includes(sp.name.toLowerCase())
        ) {
          return incrementSportVerificationText(sp);
        }
        return sp;
      })
    : profile.sports;

  return {
    ...profile,
    karma: nextKarma,
    tier: nextTier,
    matchesCount: nextMatchesCount,
    noShowsCount: nextNoShows,
    endorsedCount: nextEndorsedCount,
    badges: updatedBadges,
    sports: updatedSports,
  };
}

export function incrementSportVerificationText<
  T extends { verifications: string }
>(sportItem: T): T {
  const match = sportItem.verifications.match(/^(\d+)\s+(.*)$/);
  if (match) {
    const count = parseInt(match[1], 10) + 1;
    return {
      ...sportItem,
      verifications: `${count} ${match[2]}`,
    };
  }
  return {
    ...sportItem,
    verifications: "1 Captain verification",
  };
}

export function endorseSportOnProfile(
  profile: UserProfile,
  sportId: number
): UserProfile {
  return {
    ...profile,
    endorsedCount: profile.endorsedCount + 1,
    sports: profile.sports.map((sp) =>
      sp.id === sportId ? incrementSportVerificationText(sp) : sp
    ),
  };
}
