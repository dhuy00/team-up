import type { GeoCoordinates, LocationPreset } from "@/types/models";

export const DEFAULT_RADAR_CENTER: GeoCoordinates = {
  lat: 37.7749,
  lng: -122.4194,
};

export const DEFAULT_LOCATION_LABEL = "Downtown Metro Area";

export const RADAR_PAN_THRESHOLD_KM = 0.6;
export const RADAR_REBASE_DISTANCE_KM = 35;

export const LEAFLET_CDN = {
  CSS_ID: "leaflet-cdn-css",
  CSS_URL: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  JS_ID: "leaflet-cdn-js",
  JS_URL: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
} as const;

export const CARTO_TILE_URLS = {
  DARK: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  LIGHT: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  ATTRIBUTION: '&copy; <a href="https://carto.com/">CARTO</a>',
} as const;

// Preset relative offsets for events when rebasing to a new city or user GPS location
export const EVENT_OFFSETS: GeoCoordinates[] = [
  { lat: 0.006, lng: 0.005 },
  { lat: -0.012, lng: -0.009 },
  { lat: 0.015, lng: 0.014 },
  { lat: 0.004, lng: -0.006 },
  { lat: 0.022, lng: -0.024 },
  { lat: -0.009, lng: 0.015 },
];

export const LOCATION_PRESETS: LocationPreset[] = [
  { label: "Metro Center", lat: 37.7749, lng: -122.4194 },
  { label: "TP.HCM (Q.1)", lat: 10.7769, lng: 106.7009 },
  { label: "Hà Nội (Hoàn Kiếm)", lat: 21.0285, lng: 105.8542 },
  { label: "Đà Nẵng", lat: 16.0544, lng: 108.2022 },
];
