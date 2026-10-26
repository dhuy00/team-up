"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Navigation,
  Search,
  Crosshair,
  Users,
  Sparkles,
  MapPin,
  Loader2,
  Eye,
  Map as MapIcon,
  ListFilter,
} from "lucide-react";
import { useTheme } from "next-themes";
import { EventActivity } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";

export interface RadarVisualFeedProps {
  events: EventActivity[];
  allEvents?: EventActivity[];
  selectedRadius?: number;
  onSelectEvent: (event: EventActivity) => void;
  onUpdateEvents?: (events: EventActivity[]) => void;
}

type RadarDisplayMode = "map" | "venues";

interface NearbyPlayer {
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

const NEARBY_PLAYERS_SEED: NearbyPlayer[] = [
  {
    id: "p1",
    name: "Minh Tuấn",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&h=80&fit=crop&crop=faces",
    sport: "Soccer",
    sportIcon: "⚽",
    skill: "Intermediate",
    karma: 98,
    status: "Looking for 5v5 match tonight",
    latOffset: 0.008,
    lngOffset: 0.011,
  },
  {
    id: "p2",
    name: "Sarah Jenkins",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces",
    sport: "Badminton",
    sportIcon: "🏸",
    skill: "Advanced",
    karma: 99,
    status: "Ready for doubles partner",
    latOffset: -0.009,
    lngOffset: 0.007,
  },
  {
    id: "p3",
    name: "Kenji Sato",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
    sport: "Basketball",
    sportIcon: "🏀",
    skill: "All Levels",
    karma: 95,
    status: "At court — need 2 more for 3v3",
    latOffset: 0.014,
    lngOffset: -0.008,
  },
  {
    id: "p4",
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=faces",
    sport: "Pickleball",
    sportIcon: "🏓",
    skill: "Intermediate",
    karma: 97,
    status: "Free this evening within 5km",
    latOffset: -0.006,
    lngOffset: -0.013,
  },
];

// Preset relative offsets for events when rebasing to a new city or user GPS location
const EVENT_OFFSETS = [
  { lat: 0.006, lng: 0.005 },
  { lat: -0.012, lng: -0.009 },
  { lat: 0.015, lng: 0.014 },
  { lat: 0.004, lng: -0.006 },
  { lat: 0.022, lng: -0.024 },
  { lat: -0.009, lng: 0.015 },
];

const LOCATION_PRESETS = [
  { label: "Metro Center", lat: 37.7749, lng: -122.4194 },
  { label: "TP.HCM (Q.1)", lat: 10.7769, lng: 106.7009 },
  { label: "Hà Nội (Hoàn Kiếm)", lat: 21.0285, lng: 105.8542 },
  { label: "Đà Nẵng", lat: 16.0544, lng: 108.2022 },
];

function calculateDistanceKm(
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

export const RadarVisualFeed: React.FC<RadarVisualFeedProps> = ({
  events,
  allEvents,
  selectedRadius = 10,
  onSelectEvent,
  onUpdateEvents,
}) => {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const centerMarkerRef = useRef<any>(null);
  const eventMarkersMapRef = useRef<Record<number, any>>({});

  const [displayMode, setDisplayMode] = useState<RadarDisplayMode>("map");
  const [leafletReady, setLeafletReady] = useState(false);
  const [radarCenter, setRadarCenter] = useState<{ lat: number; lng: number }>({
    lat: 37.7749,
    lng: -122.4194,
  });
  const [mapMovedCenter, setMapMovedCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locationLabel, setLocationLabel] = useState("Downtown Metro Area");
  const [showPlayersLayer, setShowPlayersLayer] = useState(true);
  const [activeEventId, setActiveEventId] = useState<number | null>(null);

  // Load Leaflet CSS & JS from CDN safely on client
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).L) {
      setLeafletReady(true);
      return;
    }

    const existingCss = document.getElementById("leaflet-cdn-css");
    if (!existingCss) {
      const link = document.createElement("link");
      link.id = "leaflet-cdn-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById(
      "leaflet-cdn-js"
    ) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => setLeafletReady(true));
      return;
    }

    const script = document.createElement("script");
    script.id = "leaflet-cdn-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => setLeafletReady(true);
    document.body.appendChild(script);
  }, []);

  // Re-anchor or recalculate event distances around a new radar center
  const syncEventsAroundCenter = useCallback(
    (newLat: number, newLng: number, forceRebase = false) => {
      const sourceEvents = allEvents ?? events;
      if (!onUpdateEvents || sourceEvents.length === 0) return;

      const firstEv = sourceEvents[0];
      const distFromCluster = calculateDistanceKm(
        newLat,
        newLng,
        firstEv.lat,
        firstEv.lng
      );
      const shouldRebase = forceRebase || distFromCluster > 35;

      const updated = sourceEvents.map((ev, idx) => {
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

      onUpdateEvents(updated);
    },
    [allEvents, events, onUpdateEvents]
  );

  // Initialize Leaflet Map instance
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [radarCenter.lat, radarCenter.lng],
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const isDark = resolvedTheme === "dark";
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    // Detect map drag/pan so user can click "Search Here"
    map.on("moveend", () => {
      const c = map.getCenter();
      setMapMovedCenter({ lat: c.lat, lng: c.lng });
    });

    // Allow clicking directly on map background to reposition radar center
    map.on("click", (e: any) => {
      const clickedLat = e.latlng.lat;
      const clickedLng = e.latlng.lng;
      setRadarCenter({ lat: clickedLat, lng: clickedLng });
      setMapMovedCenter(null);
      setLocationLabel(
        `${clickedLat.toFixed(3)}°, ${clickedLng.toFixed(3)}°`
      );
      syncEventsAroundCenter(clickedLat, clickedLng, false);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady]);

  // Recalculate Leaflet container dimensions when toggling back to "map" mode
  useEffect(() => {
    if (displayMode === "map" && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 60);
    }
  }, [displayMode]);

  // Switch tile layer when theme changes (Light <-> Dark)
  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const isDark = resolvedTheme === "dark";
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
  }, [resolvedTheme, leafletReady]);

  // Render Radar Center, Radius Circle, Game Pins, and Nearby Players Pins
  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current || !markersLayerRef.current)
      return;
    const L = (window as any).L;
    if (!L) return;

    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    layerGroup.clearLayers();
    eventMarkersMapRef.current = {};

    // 1. Search Radius Circle (e.g. 10km)
    const circle = L.circle([radarCenter.lat, radarCenter.lng], {
      radius: selectedRadius * 1000,
      color: "#9fe870",
      weight: 2,
      dashArray: "6 6",
      fillColor: "#9fe870",
      fillOpacity: 0.1,
      interactive: false,
    });
    circle.addTo(layerGroup);
    radiusCircleRef.current = circle;

    // 2. Radar Center (User / Search Origin Marker with pulsing ring)
    const centerIconHtml = `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div class="radar-pulse-ring" style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(159, 232, 112, 0.55); border: 2px solid #9fe870;"></div>
        <div style="position: relative; width: 16px; height: 16px; border-radius: 9999px; background: #0e0f0c; border: 3px solid #9fe870; box-shadow: 0 2px 8px rgba(0,0,0,0.35);"></div>
      </div>
    `;
    const centerIcon = L.divIcon({
      html: centerIconHtml,
      className: "radar-center-pin",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const centerMarker = L.marker([radarCenter.lat, radarCenter.lng], {
      icon: centerIcon,
      zIndexOffset: 1000,
    }).addTo(layerGroup);

    centerMarker.bindPopup(`
      <div style="font-family: 'Inter', sans-serif; padding: 2px 4px;">
        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #2ead4b;">
          ${t("explore.radarCenter")}
        </div>
        <div style="font-size: 12px; font-weight: 800; margin-top: 1px;">
          ${locationLabel}
        </div>
        <div style="font-size: 11px; opacity: 0.75; margin-top: 2px;">
          ${t("explore.distanceWithin", { distance: selectedRadius })}
        </div>
      </div>
    `);
    centerMarkerRef.current = centerMarker;

    // 3. Nearby Active Players ("Others' locations")
    if (showPlayersLayer) {
      NEARBY_PLAYERS_SEED.forEach((player) => {
        const pLat = radarCenter.lat + player.latOffset;
        const pLng = radarCenter.lng + player.lngOffset;
        const pDist = calculateDistanceKm(
          radarCenter.lat,
          radarCenter.lng,
          pLat,
          pLng
        );

        const playerPinHtml = `
          <div style="position: relative; width: 34px; height: 34px; cursor: pointer;" title="${player.name}">
            <img
              src="${player.avatar}"
              alt="${player.name}"
              style="width: 32px; height: 32px; border-radius: 9999px; object-fit: cover; border: 2px solid #0e0f0c; box-shadow: 0 3px 8px rgba(0,0,0,0.22); background: #fff;"
            />
            <span style="position: absolute; bottom: -2px; right: -2px; background: #ffffff; border: 1.5px solid #0e0f0c; border-radius: 9999px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 10px;">
              ${player.sportIcon}
            </span>
          </div>
        `;

        const playerIcon = L.divIcon({
          html: playerPinHtml,
          className: "nearby-player-pin",
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const pMarker = L.marker([pLat, pLng], { icon: playerIcon }).addTo(
          layerGroup
        );

        pMarker.bindPopup(`
          <div style="font-family: 'Inter', sans-serif; min-width: 185px; padding: 2px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <img src="${player.avatar}" alt="${player.name}" style="width: 32px; height: 32px; border-radius: 9999px; object-fit: cover; border: 1.5px solid #0e0f0c;" />
              <div>
                <div style="font-weight: 800; font-size: 12px; line-height: 1.2;">${player.name}</div>
                <div style="font-size: 10px; font-weight: 700; color: #2ead4b;">${player.karma}% Karma • ${player.skill}</div>
              </div>
            </div>
            <div style="font-size: 11px; padding: 5px 8px; border-radius: 8px; background: rgba(159, 232, 112, 0.2); border: 1px solid rgba(14,15,12,0.12); margin-bottom: 4px;">
              ${player.sportIcon} ${player.status}
            </div>
            <div style="font-size: 10px; opacity: 0.7; font-weight: 600;">
              📍 ${pDist} km from radar center
            </div>
          </div>
        `);
      });
    }

    // 4. Active Game / Venue Markers
    events.forEach((ev) => {
      const isSelected = activeEventId === ev.id;
      const spotsLeft = ev.maxPlayers - ev.confirmedPlayers;
      const isFull = spotsLeft <= 0;

      const pinHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: ${
          isSelected ? "scale(1.15)" : "scale(1)"
        }; transition: transform 0.15s ease;">
          <div style="background: ${
            isFull ? "#ffd11a" : "#9fe870"
          }; color: #0e0f0c; height: 34px; padding: 0 10px; border-radius: 9999px; display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 800; border: 2px solid #0e0f0c; box-shadow: 0 4px 10px rgba(0,0,0,0.22); white-space: nowrap;">
            <span>${ev.icon}</span>
            <span style="font-size: 11px; font-family: monospace;">${
              ev.confirmedPlayers
            }/${ev.maxPlayers}</span>
          </div>
          <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #0e0f0c; margin-top: -1px;"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: pinHtml,
        className: "custom-event-pin",
        iconSize: [68, 42],
        iconAnchor: [34, 40],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([ev.lat, ev.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 900 : 500,
      }).addTo(layerGroup);

      const popupEl = document.createElement("div");
      popupEl.style.fontFamily = "'Inter', sans-serif";
      popupEl.style.minWidth = "205px";
      popupEl.style.padding = "2px";
      popupEl.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; background: #e2f6d5; color: #054d28; padding: 2px 7px; border-radius: 9999px; border: 1px solid #c5edab;">
            ${ev.icon} ${ev.sport}
          </span>
          <span style="font-size: 11px; font-weight: 700;">
            ${ev.distanceKm} km
          </span>
        </div>
        <div style="font-weight: 900; font-size: 13px; line-height: 1.25; margin-bottom: 4px;">
          ${ev.title}
        </div>
        <div style="font-size: 11px; opacity: 0.8; margin-bottom: 2px;">
          📍 ${ev.venue}
        </div>
        <div style="font-size: 11px; opacity: 0.8; margin-bottom: 8px;">
          ⏰ ${ev.dateTimeStr}
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px solid rgba(134,134,133,0.25);">
          <span style="font-size: 11px; font-weight: 800;">
            ${ev.confirmedPlayers}/${ev.maxPlayers} spots
          </span>
          <button
            type="button"
            class="radar-popup-detail-btn"
            style="background: #9fe870; color: #0e0f0c; border: 1.5px solid #0e0f0c; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; cursor: pointer;"
          >
            ${t("common.details")}
          </button>
        </div>
      `;

      const detailBtn = popupEl.querySelector(".radar-popup-detail-btn");
      if (detailBtn) {
        detailBtn.addEventListener("click", () => {
          onSelectEvent(ev);
        });
      }

      marker.bindPopup(popupEl);
      marker.on("click", () => {
        setActiveEventId(ev.id);
      });

      eventMarkersMapRef.current[ev.id] = marker;
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [
    leafletReady,
    events,
    radarCenter,
    selectedRadius,
    showPlayersLayer,
    activeEventId,
    locationLabel,
    onSelectEvent,
    t,
  ]);

  // Handler: Access user's real browser GPS location
  const handleUseMyLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        setRadarCenter({ lat: userLat, lng: userLng });
        setMapMovedCenter(null);
        setLocationLabel(t("explore.useMyLocation"));
        setIsLocatingUser(false);

        syncEventsAroundCenter(userLat, userLng, true);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([userLat, userLng], 13, {
            duration: 1.1,
          });
        }
      },
      () => {
        setIsLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Handler: Search any location/city/address via OpenStreetMap Nominatim
  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = locationQuery.trim();
    if (!query) return;

    setIsSearchingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=1`
      );
      const results = await response.json();
      if (Array.isArray(results) && results.length > 0) {
        const targetLat = parseFloat(results[0].lat);
        const targetLng = parseFloat(results[0].lon);
        const displayName =
          results[0].display_name?.split(",").slice(0, 2).join(", ") || query;

        setRadarCenter({ lat: targetLat, lng: targetLng });
        setMapMovedCenter(null);
        setLocationLabel(displayName);
        syncEventsAroundCenter(targetLat, targetLng, true);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([targetLat, targetLng], 13, {
            duration: 1.1,
          });
        }
      }
    } catch {
      const matchedPreset = LOCATION_PRESETS.find((p) =>
        p.label.toLowerCase().includes(query.toLowerCase())
      );
      if (matchedPreset) {
        handleSelectPreset(matchedPreset);
      }
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Handler: Quick-jump to a preset city/hub
  const handleSelectPreset = (preset: {
    label: string;
    lat: number;
    lng: number;
  }) => {
    setRadarCenter({ lat: preset.lat, lng: preset.lng });
    setMapMovedCenter(null);
    setLocationLabel(preset.label);
    syncEventsAroundCenter(preset.lat, preset.lng, true);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([preset.lat, preset.lng], 13, {
        duration: 1.0,
      });
    }
  };

  // Handler: Scan the current panned map area ("Search Here")
  const handleScanCurrentArea = () => {
    if (!mapMovedCenter) return;
    const { lat, lng } = mapMovedCenter;
    setRadarCenter({ lat, lng });
    setMapMovedCenter(null);
    setLocationLabel(`${lat.toFixed(3)}°, ${lng.toFixed(3)}°`);
    syncEventsAroundCenter(lat, lng, true);
  };

  // Handler: Focus a game pin on the map (switches from Venues mode -> Map mode and flies to pin)
  const handleFocusEventOnMap = (ev: EventActivity) => {
    setActiveEventId(ev.id);
    setDisplayMode("map");
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        mapInstanceRef.current.flyTo([ev.lat, ev.lng], 14, { duration: 0.7 });
        const marker = eventMarkersMapRef.current[ev.id];
        if (marker) {
          marker.openPopup();
        }
      }
    }, 80);
  };

  const hasMapPanned =
    mapMovedCenter &&
    calculateDistanceKm(
      radarCenter.lat,
      radarCenter.lng,
      mapMovedCenter.lat,
      mapMovedCenter.lng
    ) > 0.6;

  return (
    <div className="space-y-3">
      {/* Mode Switcher: Live Radar Map vs Active Venues Nearby */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-canvas-soft rounded-[14px] border border-border">
        <button
          type="button"
          onClick={() => setDisplayMode("map")}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] text-xs font-bold transition cursor-pointer ${
            displayMode === "map"
              ? "bg-canvas text-ink shadow-xs border border-border/60"
              : "text-body hover:text-ink"
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>{t("explore.liveRadar")}</span>
        </button>

        <button
          type="button"
          onClick={() => setDisplayMode("venues")}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] text-xs font-bold transition cursor-pointer ${
            displayMode === "venues"
              ? "bg-canvas text-ink shadow-xs border border-border/60"
              : "text-body hover:text-ink"
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span className="truncate">{t("explore.activeVenuesNearby")}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-primary text-ink border border-ink/20">
            {events.length}
          </span>
        </button>
      </div>

      {/* Location Search & GPS Bar (Shared across both modes) */}
      <form onSubmit={handleSearchLocation} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input
            type="text"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            placeholder={t("explore.searchLocationPlaceholder")}
            className="w-full pl-8 pr-3 py-2 bg-canvas-soft border border-border rounded-[12px] text-xs text-ink placeholder:text-mute focus:border-ink focus:outline-none transition"
          />
        </div>

        <button
          type="submit"
          disabled={isSearchingLocation}
          className="px-3 py-2 bg-canvas-soft hover:bg-canvas text-ink border border-border rounded-[12px] text-xs font-semibold transition cursor-pointer shrink-0"
        >
          {isSearchingLocation ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            t("common.search")
          )}
        </button>

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocatingUser}
          title={t("explore.useMyLocation")}
          className="btn-primary px-3 py-2 rounded-[12px] text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-xs"
        >
          {isLocatingUser ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {isLocatingUser ? t("explore.locating") : t("explore.useMyLocation")}
          </span>
        </button>
      </form>

      {/* Quick Location Hub Pills + Nearby Players Toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {LOCATION_PRESETS.map((preset) => {
            const isCurrent = locationLabel === preset.label;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer shrink-0 ${
                  isCurrent
                    ? "bg-ink text-canvas border-ink"
                    : "bg-canvas-soft text-body border-border hover:border-ink/50"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {displayMode === "map" && (
          <button
            type="button"
            onClick={() => setShowPlayersLayer((prev) => !prev)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1 transition cursor-pointer ${
              showPlayersLayer
                ? "bg-primary-pale text-positive-deep border-primary-neutral"
                : "bg-canvas-soft text-mute border-border"
            }`}
          >
            <Users className="w-3 h-3" />
            <span>
              {t("explore.playersNearby", { count: NEARBY_PLAYERS_SEED.length })}
            </span>
          </button>
        )}
      </div>

      {/* MODE 1: Interactive Map Canvas (kept mounted and hidden when in 'venues' mode to preserve map state) */}
      <div
        className={`relative rounded-[18px] overflow-hidden border border-border bg-canvas-soft h-[340px] shadow-inner ${
          displayMode === "map" ? "block" : "hidden"
        }`}
      >
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Loading state while Leaflet initializes */}
        {!leafletReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-canvas-soft text-xs text-mute z-20">
            <Loader2 className="w-5 h-5 animate-spin text-ink" />
            <span>{t("common.loading")}</span>
          </div>
        )}

        {/* Top-left Active Radar Status Badge */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-1.5 bg-canvas/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-border shadow-xs">
          <span className="w-2 h-2 rounded-full bg-positive animate-pulse" />
          <span className="text-[11px] font-bold text-ink truncate max-w-[160px]">
            {locationLabel}
          </span>
          <span className="text-[10px] font-mono text-mute">
            • {selectedRadius}km
          </span>
        </div>

        {/* Floating "Search Here" Button when user pans the map */}
        {hasMapPanned && (
          <button
            type="button"
            onClick={handleScanCurrentArea}
            className="absolute top-3 right-3 z-20 btn-primary px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md border border-ink"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{t("explore.scanArea")}</span>
          </button>
        )}

        {/* Bottom-left Map Hint */}
        <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none bg-canvas/85 backdrop-blur-xs px-2.5 py-1 rounded-full border border-border text-[10px] text-body font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-positive-deep shrink-0" />
          <span className="truncate">{t("explore.clickMapHint")}</span>
        </div>
      </div>

      {/* MODE 2: Dedicated Active Venues Nearby View */}
      {displayMode === "venues" && (
        <div className="bg-canvas-soft rounded-[18px] p-3.5 border border-border h-[340px] flex flex-col">
          <div className="text-xs text-body font-semibold flex items-center justify-between pb-2.5 mb-2.5 border-b border-border shrink-0">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-ink" />
              <span>{locationLabel}</span>
            </span>
            <span className="text-positive-deep text-[10px] font-bold uppercase bg-primary-pale px-2 py-0.5 rounded-full border border-primary-neutral">
              {t("explore.distanceWithin", { distance: selectedRadius })}
            </span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {events.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs text-mute">
                <p className="font-bold text-ink">{t("explore.noActivitiesFound")}</p>
                <p className="mt-1">{t("explore.noActivitiesHint")}</p>
              </div>
            ) : (
              events.map((ev) => {
                const isSelected = activeEventId === ev.id;
                return (
                  <div
                    key={ev.id}
                    onClick={() => handleFocusEventOnMap(ev)}
                    className={`p-3 bg-canvas hover:bg-canvas-soft/80 border rounded-[14px] cursor-pointer transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? "border-ink ring-1 ring-ink"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary text-ink border border-ink flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                        {ev.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-ink truncate">
                          {ev.title}
                        </div>
                        <div className="text-[11px] text-mute flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-[11px] font-mono font-bold text-ink block">
                          {t("explore.distanceShort", {
                            distance: ev.distanceKm,
                          })}
                        </span>
                        <span className="text-[10px] text-positive-deep font-semibold">
                          {ev.confirmedPlayers}/{ev.maxPlayers}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(ev);
                        }}
                        title={t("common.details")}
                        className="p-1.5 rounded-full bg-canvas-soft hover:bg-primary text-ink border border-border transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RadarVisualFeed;
