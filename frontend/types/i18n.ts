export type Locale = "en" | "vi";

export interface TranslationDictionary {
  metadata: {
    title: string;
    description: string;
  };
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
    close: string;
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
    distanceAway: string;
    distanceShort: string;
    pinsActive: string;
    activeVenuesNearby: string;
    liveRadar: string;
    radarHint: string;
    searchLocationPlaceholder: string;
    useMyLocation: string;
    locating: string;
    scanArea: string;
    radarCenter: string;
    clickMapHint: string;
    playersNearby: string;
  };
  eventDetail: {
    eventHost: string;
    karmaPercent: string;
    location: string;
    schedule: string;
    fee: string;
    capacity: string;
    spotsFilled: string;
    hostNotes: string;
    confirmedRoster: string;
    leaveSpot: string;
    joinWaitlist: string;
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
  footer: {
    builtWith: string;
    tagline: string;
    rights: string;
  };
}
