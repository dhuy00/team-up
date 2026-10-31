export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface LocationPreset extends GeoCoordinates {
  label: string;
}

export type RadarDisplayMode = "map" | "venues";

export interface NearbyPlayer {
  id: string;
  name: string;
  avatar: string;
  sport: string;
  sportIcon: string;
  skill: string;
  karma: number;
  status: string;
  latOffset: number;
  lngOffset: number;
}

export interface Host {
  name: string;
  karma: number;
  avatar: string;
}

export interface RosterPlayer {
  name: string;
  role: string;
  karma: number;
}

export interface EventActivity {
  id: number;
  title: string;
  sport: string;
  icon: string;
  skill: string;
  venue: string;
  address: string;
  distanceKm: number;
  lat: number;
  lng: number;
  dateTimeStr: string;
  startTimeIso?: string;
  cost: string;
  confirmedPlayers: number;
  maxPlayers: number;
  host: Host;
  userJoined: boolean;
  isUserHost?: boolean;
  roster: RosterPlayer[];
  notes: string;
  joinPolicy?: "instant" | "request";
}

export interface TeamSquad {
  id: number;
  name: string;
  sport: string;
  abbr: string;
  variant: "dark" | "white" | "green";
  featuredBadge?: string;
  memberCount: number;
  maxMembers: number;
  description: string;
  captain: string;
  venue: string;
  statLabel: string;
  statValue: string;
}

export interface ChatMessage {
  id: number;
  sender: string;
  avatar: string;
  time: string;
  text: string;
  isHost?: boolean;
}

export interface ChatChannel {
  id: number;
  eventId?: number;
  title: string;
  subtitle: string;
  sportIcon: string;
  lastMessage: string;
  lastTime: string;
  avatar?: string;
  pinnedAnnouncement?: string;
  messages: ChatMessage[];
}

export interface SportPassportItem {
  id: number;
  name: string;
  icon: string;
  role: string;
  skillTier: string;
  verifications: string;
}

export interface UserProfile {
  name: string;
  username: string;
  location: string;
  avatar: string;
  karma: number;
  tier: string;
  bio: string;
  matchesCount: number;
  noShowsCount: number;
  endorsedCount: number;
  badges: { label: string; count: number }[];
  sports: SportPassportItem[];
  availability: { day: string; status: string; statusType: "busy" | "preferred" | "primary" }[];
}
