"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Crosshair, Sparkles, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { EventActivity, GeoCoordinates, NearbyPlayer } from "@/types/models";
import {
  LeafletLayer,
  LeafletLayerGroup,
  LeafletMap,
  LeafletMapEvent,
  LeafletMarker,
} from "@/types/leaflet";
import { CARTO_TILE_URLS } from "@/constants/radar";
import { calculateDistanceKm } from "@/lib/geo";
import { useTranslation } from "@/hooks/useTranslation";
import {
  buildRadarCenterIconHtml,
  buildRadarCenterPopupHtml,
  buildNearbyPlayerIconHtml,
  buildNearbyPlayerPopupHtml,
  buildEventPinIconHtml,
  createEventPopupElement,
} from "./leafletPopupTemplates";

export interface RadarMapCanvasHandle {
  flyTo: (lat: number, lng: number, zoom?: number, duration?: number) => void;
  focusEventMarker: (ev: EventActivity) => void;
}

interface RadarMapCanvasProps {
  visible: boolean;
  leafletReady: boolean;
  radarCenter: GeoCoordinates;
  selectedRadius: number;
  locationLabel: string;
  events: EventActivity[];
  nearbyPlayers: NearbyPlayer[];
  showPlayersLayer: boolean;
  activeEventId: number | null;
  hasMapPanned: boolean;
  onMapMoveEnd: (center: GeoCoordinates) => void;
  onMapClick: (coords: GeoCoordinates) => void;
  onScanCurrentArea: () => void;
  onSelectEventPin: (eventId: number) => void;
  onOpenEventDetails: (ev: EventActivity) => void;
}

export const RadarMapCanvas = forwardRef<
  RadarMapCanvasHandle,
  RadarMapCanvasProps
>(
  (
    {
      visible,
      leafletReady,
      radarCenter,
      selectedRadius,
      locationLabel,
      events,
      nearbyPlayers,
      showPlayersLayer,
      activeEventId,
      hasMapPanned,
      onMapMoveEnd,
      onMapClick,
      onScanCurrentArea,
      onSelectEventPin,
      onOpenEventDetails,
    },
    ref
  ) => {
    const { t } = useTranslation();
    const { resolvedTheme } = useTheme();

    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<LeafletMap | null>(null);
    const tileLayerRef = useRef<LeafletLayer | null>(null);
    const markersLayerRef = useRef<LeafletLayerGroup | null>(null);
    const eventMarkersMapRef = useRef<Record<number, LeafletMarker>>({});

    // Keep latest callbacks in refs for Leaflet event listeners attached at init
    const onMapMoveEndRef = useRef(onMapMoveEnd);
    const onMapClickRef = useRef(onMapClick);
    useEffect(() => {
      onMapMoveEndRef.current = onMapMoveEnd;
      onMapClickRef.current = onMapClick;
    }, [onMapMoveEnd, onMapClick]);

    useImperativeHandle(ref, () => ({
      flyTo: (lat: number, lng: number, zoom = 13, duration = 1.1) => {
        mapInstanceRef.current?.flyTo([lat, lng], zoom, { duration });
      },
      focusEventMarker: (ev: EventActivity) => {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
            mapInstanceRef.current.flyTo([ev.lat, ev.lng], 14, {
              duration: 0.7,
            });
            const marker = eventMarkersMapRef.current[ev.id];
            if (marker) {
              marker.openPopup();
            }
          }
        }, 80);
      },
    }));

    // Initialize Leaflet Map instance
    useEffect(() => {
      if (!leafletReady || !mapContainerRef.current) return;
      const L = window.L;
      if (!L || mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [radarCenter.lat, radarCenter.lng],
        zoom: 13,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const isDark = resolvedTheme === "dark";
      const tileUrl = isDark ? CARTO_TILE_URLS.DARK : CARTO_TILE_URLS.LIGHT;

      tileLayerRef.current = L.tileLayer(tileUrl, {
        attribution: CARTO_TILE_URLS.ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);

      map.on("moveend", () => {
        const c = map.getCenter();
        onMapMoveEndRef.current({ lat: c.lat, lng: c.lng });
      });

      map.on("click", (e: LeafletMapEvent) => {
        onMapClickRef.current({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        });
      });

      mapInstanceRef.current = map;

      return () => {
        map.remove();
        mapInstanceRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leafletReady]);

    // Recalculate container dimensions when toggling back to visible map mode
    useEffect(() => {
      if (visible && mapInstanceRef.current) {
        setTimeout(() => {
          mapInstanceRef.current?.invalidateSize();
        }, 60);
      }
    }, [visible]);

    // Switch tile layer when theme changes (Light <-> Dark)
    useEffect(() => {
      if (!leafletReady || !mapInstanceRef.current) return;
      const L = window.L;
      if (!L) return;

      if (tileLayerRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      }

      const isDark = resolvedTheme === "dark";
      const tileUrl = isDark ? CARTO_TILE_URLS.DARK : CARTO_TILE_URLS.LIGHT;

      tileLayerRef.current = L.tileLayer(tileUrl, {
        attribution: CARTO_TILE_URLS.ATTRIBUTION,
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }, [resolvedTheme, leafletReady]);

    // Render Radar Center, Radius Circle, Game Pins, and Nearby Players Pins
    useEffect(() => {
      if (!leafletReady || !mapInstanceRef.current || !markersLayerRef.current)
        return;
      const L = window.L;
      if (!L) return;

      const map = mapInstanceRef.current;
      const layerGroup = markersLayerRef.current;
      layerGroup.clearLayers();
      eventMarkersMapRef.current = {};

      // 1. Search Radius Circle
      L.circle([radarCenter.lat, radarCenter.lng], {
        radius: selectedRadius * 1000,
        color: "#9fe870",
        weight: 2,
        dashArray: "6 6",
        fillColor: "#9fe870",
        fillOpacity: 0.1,
        interactive: false,
      }).addTo(layerGroup);

      // 2. Radar Center (User / Search Origin Marker with pulsing ring)
      const centerIcon = L.divIcon({
        html: buildRadarCenterIconHtml(),
        className: "radar-center-pin",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const centerMarker = L.marker([radarCenter.lat, radarCenter.lng], {
        icon: centerIcon,
        zIndexOffset: 1000,
      }).addTo(layerGroup);

      centerMarker.bindPopup(
        buildRadarCenterPopupHtml({
          radarCenterTitle: t("explore.radarCenter"),
          locationLabel,
          distanceWithinText: t("explore.distanceWithin", {
            distance: selectedRadius,
          }),
        })
      );

      // 3. Nearby Active Players
      if (showPlayersLayer) {
        nearbyPlayers.forEach((player) => {
          const pLat = radarCenter.lat + player.latOffset;
          const pLng = radarCenter.lng + player.lngOffset;
          const pDist = calculateDistanceKm(
            radarCenter.lat,
            radarCenter.lng,
            pLat,
            pLng
          );

          const playerIcon = L.divIcon({
            html: buildNearbyPlayerIconHtml(player),
            className: "nearby-player-pin",
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          });

          const pMarker = L.marker([pLat, pLng], { icon: playerIcon }).addTo(
            layerGroup
          );

          pMarker.bindPopup(buildNearbyPlayerPopupHtml(player, pDist));
        });
      }

      // 4. Active Game / Venue Markers
      events.forEach((ev) => {
        const isSelected = activeEventId === ev.id;

        const customIcon = L.divIcon({
          html: buildEventPinIconHtml(ev, isSelected),
          className: "custom-event-pin",
          iconSize: [68, 42],
          iconAnchor: [34, 40],
          popupAnchor: [0, -36],
        });

        const marker = L.marker([ev.lat, ev.lng], {
          icon: customIcon,
          zIndexOffset: isSelected ? 900 : 500,
        }).addTo(layerGroup);

        const popupEl = createEventPopupElement(
          ev,
          t("common.details"),
          onOpenEventDetails
        );

        marker.bindPopup(popupEl);
        marker.on("click", () => {
          onSelectEventPin(ev.id);
        });

        eventMarkersMapRef.current[ev.id] = marker;
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }, [
      leafletReady,
      events,
      nearbyPlayers,
      radarCenter,
      selectedRadius,
      showPlayersLayer,
      activeEventId,
      locationLabel,
      onOpenEventDetails,
      onSelectEventPin,
      t,
    ]);

    return (
      <div
        className={`relative rounded-[18px] overflow-hidden border border-border bg-canvas-soft h-[340px] shadow-inner ${
          visible ? "block" : "hidden"
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
            onClick={onScanCurrentArea}
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
    );
  }
);

RadarMapCanvas.displayName = "RadarMapCanvas";
