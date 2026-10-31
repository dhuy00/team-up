"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  EventActivity,
  GeoCoordinates,
  LocationPreset,
  RadarDisplayMode,
} from "@/types/models";
import {
  DEFAULT_RADAR_CENTER,
  DEFAULT_LOCATION_LABEL,
  RADAR_PAN_THRESHOLD_KM,
  LOCATION_PRESETS,
} from "@/constants/radar";
import { NEARBY_PLAYERS_SEED } from "@/lib/mockData";
import {
  calculateDistanceKm,
  formatCoordinatesLabel,
  rebaseEventsAroundCenter,
} from "@/lib/geo";
import {
  getBrowserCoordinates,
  searchLocationNominatim,
} from "@/services/geocoding";
import { useLeafletLoader } from "@/hooks/useLeafletLoader";
import { useTranslation } from "@/hooks/useTranslation";
import { RadarControls } from "./radar/RadarControls";
import { RadarMapCanvas, RadarMapCanvasHandle } from "./radar/RadarMapCanvas";
import { RadarVenuesList } from "./radar/RadarVenuesList";

export interface RadarVisualFeedProps {
  events: EventActivity[];
  allEvents?: EventActivity[];
  selectedRadius?: number;
  onSelectEvent: (event: EventActivity) => void;
  onUpdateEvents?: (events: EventActivity[]) => void;
}

export const RadarVisualFeed: React.FC<RadarVisualFeedProps> = ({
  events,
  allEvents,
  selectedRadius = 10,
  onSelectEvent,
  onUpdateEvents,
}) => {
  const { t } = useTranslation();
  const leafletReady = useLeafletLoader();
  const mapCanvasRef = useRef<RadarMapCanvasHandle | null>(null);

  const [displayMode, setDisplayMode] = useState<RadarDisplayMode>("map");
  const [radarCenter, setRadarCenter] = useState<GeoCoordinates>(
    DEFAULT_RADAR_CENTER
  );
  const [mapMovedCenter, setMapMovedCenter] = useState<GeoCoordinates | null>(
    null
  );
  const [locationQuery, setLocationQuery] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locationLabel, setLocationLabel] = useState(DEFAULT_LOCATION_LABEL);
  const [showPlayersLayer, setShowPlayersLayer] = useState(true);
  const [activeEventId, setActiveEventId] = useState<number | null>(null);

  // Re-anchor or recalculate event distances around a new radar center
  const syncEventsAroundCenter = useCallback(
    (newLat: number, newLng: number, forceRebase = false) => {
      const sourceEvents = allEvents ?? events;
      if (!onUpdateEvents || sourceEvents.length === 0) return;

      const updated = rebaseEventsAroundCenter(
        sourceEvents,
        newLat,
        newLng,
        forceRebase
      );
      onUpdateEvents(updated);
    },
    [allEvents, events, onUpdateEvents]
  );

  const applyNewRadarOrigin = useCallback(
    (
      lat: number,
      lng: number,
      label: string,
      options?: { forceRebase?: boolean; flyDuration?: number }
    ) => {
      setRadarCenter({ lat, lng });
      setMapMovedCenter(null);
      setLocationLabel(label);
      syncEventsAroundCenter(lat, lng, options?.forceRebase ?? true);

      if (options?.flyDuration !== undefined) {
        mapCanvasRef.current?.flyTo(lat, lng, 13, options.flyDuration);
      }
    },
    [syncEventsAroundCenter]
  );

  // Handler: Quick-jump to a preset city/hub
  const handleSelectPreset = useCallback(
    (preset: LocationPreset) => {
      applyNewRadarOrigin(preset.lat, preset.lng, preset.label, {
        forceRebase: true,
        flyDuration: 1.0,
      });
    },
    [applyNewRadarOrigin]
  );

  // Handler: Access user's real browser GPS location
  const handleUseMyLocation = async () => {
    setIsLocatingUser(true);
    try {
      const coords = await getBrowserCoordinates();
      applyNewRadarOrigin(coords.lat, coords.lng, t("explore.useMyLocation"), {
        forceRebase: true,
        flyDuration: 1.1,
      });
    } catch {
      // Ignore geolocation rejection or timeout
    } finally {
      setIsLocatingUser(false);
    }
  };

  // Handler: Search any location/city/address via OpenStreetMap Nominatim
  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = locationQuery.trim();
    if (!query) return;

    setIsSearchingLocation(true);
    try {
      const result = await searchLocationNominatim(query);
      if (result) {
        applyNewRadarOrigin(result.lat, result.lng, result.displayName, {
          forceRebase: true,
          flyDuration: 1.1,
        });
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

  // Handler: Scan the current panned map area ("Search Here")
  const handleScanCurrentArea = () => {
    if (!mapMovedCenter) return;
    const { lat, lng } = mapMovedCenter;
    applyNewRadarOrigin(lat, lng, formatCoordinatesLabel(lat, lng), {
      forceRebase: true,
    });
  };

  // Handler: Map background click repositions radar center
  const handleMapClick = useCallback(
    (coords: GeoCoordinates) => {
      applyNewRadarOrigin(
        coords.lat,
        coords.lng,
        formatCoordinatesLabel(coords.lat, coords.lng),
        { forceRebase: false }
      );
    },
    [applyNewRadarOrigin]
  );

  // Handler: Focus a game pin on the map (switches from Venues mode -> Map mode and flies to pin)
  const handleFocusEventOnMap = (ev: EventActivity) => {
    setActiveEventId(ev.id);
    setDisplayMode("map");
    mapCanvasRef.current?.focusEventMarker(ev);
  };

  const hasMapPanned = Boolean(
    mapMovedCenter &&
      calculateDistanceKm(
        radarCenter.lat,
        radarCenter.lng,
        mapMovedCenter.lat,
        mapMovedCenter.lng
      ) > RADAR_PAN_THRESHOLD_KM
  );

  return (
    <div className="space-y-3">
      <RadarControls
        displayMode={displayMode}
        onChangeDisplayMode={setDisplayMode}
        eventsCount={events.length}
        locationQuery={locationQuery}
        onChangeLocationQuery={setLocationQuery}
        onSearchLocation={handleSearchLocation}
        isSearchingLocation={isSearchingLocation}
        onUseMyLocation={handleUseMyLocation}
        isLocatingUser={isLocatingUser}
        locationLabel={locationLabel}
        onSelectPreset={handleSelectPreset}
        showPlayersLayer={showPlayersLayer}
        onTogglePlayersLayer={() => setShowPlayersLayer((prev) => !prev)}
        nearbyPlayersCount={NEARBY_PLAYERS_SEED.length}
      />

      {/* MODE 1: Interactive Map Canvas (kept mounted when in 'venues' mode to preserve map state) */}
      <RadarMapCanvas
        ref={mapCanvasRef}
        visible={displayMode === "map"}
        leafletReady={leafletReady}
        radarCenter={radarCenter}
        selectedRadius={selectedRadius}
        locationLabel={locationLabel}
        events={events}
        nearbyPlayers={NEARBY_PLAYERS_SEED}
        showPlayersLayer={showPlayersLayer}
        activeEventId={activeEventId}
        hasMapPanned={hasMapPanned}
        onMapMoveEnd={setMapMovedCenter}
        onMapClick={handleMapClick}
        onScanCurrentArea={handleScanCurrentArea}
        onSelectEventPin={setActiveEventId}
        onOpenEventDetails={onSelectEvent}
      />

      {/* MODE 2: Dedicated Active Venues Nearby View */}
      {displayMode === "venues" && (
        <RadarVenuesList
          events={events}
          locationLabel={locationLabel}
          selectedRadius={selectedRadius}
          activeEventId={activeEventId}
          onFocusEventOnMap={handleFocusEventOnMap}
          onSelectEvent={onSelectEvent}
        />
      )}
    </div>
  );
};

export default RadarVisualFeed;
