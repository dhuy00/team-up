export type Locale = "en" | "vi";

export interface TranslationDictionary {
  nav: {
    exploreGames: string;
    clubsAndSquads: string;
    chats: string;
    sportsPassport: string;
    hostGame: string;
    subNeeded: string;
    subNeededCount: string;
  };
  common: {
    appName: string;
    appTagline: string;
    loading: string;
    save: string;
    cancel: string;
    confirm: string;
    search: string;
    filter: string;
    reset: string;
    all: string;
    spotsRemaining: string;
    waitlistOnly: string;
    joined: string;
    rsvpSpot: string;
    details: string;
  };
  explore: {
    heroTitle: string;
    heroSubtitle: string;
    exploreActiveGames: string;
    browseSquads: string;
    quickMatchFinder: string;
    realtimeRsvp: string;
    sportActivity: string;
    maxDistance: string;
    findMatchesNearby: string;
    searchPlaceholder: string;
    allSports: string;
    allLevels: string;
    distanceWithin: string;
    matchesAvailable: string;
    resetFilters: string;
    noActivitiesFound: string;
    noActivitiesHint: string;
    localRadar: string;
  };
  sports: {
    all: string;
    soccer: string;
    basketball: string;
    badminton: string;
    pickleball: string;
    running: string;
    boardGames: string;
  };
  skills: {
    all: string;
    beginner: string;
    intermediate: string;
    advanced: string;
  };
  clubs: {
    title: string;
    subtitle: string;
    createSquad: string;
    requestInvite: string;
    instantJoin: string;
  };
  passport: {
    reliabilityKarma: string;
    matches: string;
    noShows: string;
    endorsed: string;
    fairPlayBadges: string;
    sportsPassportTitle: string;
    sportsPassportSubtitle: string;
    addSport: string;
    availabilityTitle: string;
  };
  theme: {
    light: string;
    dark: string;
    system: string;
    toggleTheme: string;
  };
  language: {
    selectLanguage: string;
    en: string;
    vi: string;
  };
}
