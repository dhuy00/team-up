export const DISTANCE_FILTER_CONFIG = {
  MIN: 1,
  MAX: 25,
  DEFAULT: 15,
  STEP: 1,
} as const;

export const HERO_DISTANCE_CONFIG = DISTANCE_FILTER_CONFIG;
export const EXPLORE_DISTANCE_CONFIG = DISTANCE_FILTER_CONFIG;

export const EVENT_CAPACITY_CONFIG = {
  MIN: 2,
  MAX: 50,
  DEFAULT: 10,
} as const;

export const DEFAULT_SPORT_FILTER = "all";
export const DEFAULT_SKILL_FILTER = "all";

export const DEFAULT_QUICK_FILTER = {
  sport: DEFAULT_SPORT_FILTER,
  radius: HERO_DISTANCE_CONFIG.DEFAULT,
} as const;

export type QuickFilterState = {
  sport: string;
  radius: number;
};

export interface SportConfigItem {
  id: string;
  value: string;
  labelKey: string;
  fallbackLabel: string;
  icon: string;
}

/**
 * Simulated API response data representing available sports & activities.
 * Can be fetched asynchronously or replaced with real backend API call.
 */
export const SIMULATED_API_SPORTS: SportConfigItem[] = [
  { id: DEFAULT_SPORT_FILTER, value: DEFAULT_SPORT_FILTER, labelKey: "sports.all", fallbackLabel: "All Sports", icon: "🏆" },
  { id: "soccer", value: "Soccer", labelKey: "sports.soccer", fallbackLabel: "Soccer / Football", icon: "⚽" },
  { id: "basketball", value: "Basketball", labelKey: "sports.basketball", fallbackLabel: "Basketball", icon: "🏀" },
  { id: "badminton", value: "Badminton", labelKey: "sports.badminton", fallbackLabel: "Badminton", icon: "🏸" },
  { id: "pickleball", value: "Pickleball", labelKey: "sports.pickleball", fallbackLabel: "Pickleball", icon: "🏓" },
  { id: "running", value: "Running", labelKey: "sports.running", fallbackLabel: "Running", icon: "🏃" },
  { id: "boardGames", value: "Board Games", labelKey: "sports.boardGames", fallbackLabel: "Board Games", icon: "🎲" },
];

/**
 * Mock API service simulating an asynchronous request to fetch sports options.
 */
export const fetchSportsApi = async (): Promise<SportConfigItem[]> => {
  return Promise.resolve(SIMULATED_API_SPORTS);
};

export interface SkillConfigItem {
  value: string;
  labelKey: string;
  fallbackLabel: string;
}

export const SKILL_OPTIONS: SkillConfigItem[] = [
  { value: DEFAULT_SKILL_FILTER, labelKey: "skills.all", fallbackLabel: "All Levels" },
  { value: "Beginner", labelKey: "skills.beginner", fallbackLabel: "Beginner Friendly" },
  { value: "Intermediate", labelKey: "skills.intermediate", fallbackLabel: "Intermediate" },
  { value: "Advanced", labelKey: "skills.advanced", fallbackLabel: "Advanced Only" },
];
