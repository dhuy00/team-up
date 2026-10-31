"use client";

import React from "react";
import {
  Navigation,
  Search,
  Users,
  Loader2,
  Map as MapIcon,
  ListFilter,
} from "lucide-react";
import { LocationPreset, RadarDisplayMode } from "@/types/models";
import { LOCATION_PRESETS } from "@/constants/radar";
import { useTranslation } from "@/hooks/useTranslation";

interface RadarControlsProps {
  displayMode: RadarDisplayMode;
  onChangeDisplayMode: (mode: RadarDisplayMode) => void;
  eventsCount: number;
  locationQuery: string;
  onChangeLocationQuery: (query: string) => void;
  onSearchLocation: (e: React.FormEvent) => void;
  isSearchingLocation: boolean;
  onUseMyLocation: () => void;
  isLocatingUser: boolean;
  locationLabel: string;
  onSelectPreset: (preset: LocationPreset) => void;
  showPlayersLayer: boolean;
  onTogglePlayersLayer: () => void;
  nearbyPlayersCount: number;
}

export const RadarControls: React.FC<RadarControlsProps> = ({
  displayMode,
  onChangeDisplayMode,
  eventsCount,
  locationQuery,
  onChangeLocationQuery,
  onSearchLocation,
  isSearchingLocation,
  onUseMyLocation,
  isLocatingUser,
  locationLabel,
  onSelectPreset,
  showPlayersLayer,
  onTogglePlayersLayer,
  nearbyPlayersCount,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Mode Switcher: Live Radar Map vs Active Venues Nearby */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-canvas-soft rounded-[14px] border border-border">
        <button
          type="button"
          onClick={() => onChangeDisplayMode("map")}
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
          onClick={() => onChangeDisplayMode("venues")}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] text-xs font-bold transition cursor-pointer ${
            displayMode === "venues"
              ? "bg-canvas text-ink shadow-xs border border-border/60"
              : "text-body hover:text-ink"
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span className="truncate">{t("explore.activeVenuesNearby")}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-primary text-ink border border-ink/20">
            {eventsCount}
          </span>
        </button>
      </div>

      {/* Location Search & GPS Bar */}
      <form onSubmit={onSearchLocation} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input
            type="text"
            value={locationQuery}
            onChange={(e) => onChangeLocationQuery(e.target.value)}
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
          onClick={onUseMyLocation}
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
                onClick={() => onSelectPreset(preset)}
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
            onClick={onTogglePlayersLayer}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1 transition cursor-pointer ${
              showPlayersLayer
                ? "bg-primary-pale text-positive-deep border-primary-neutral"
                : "bg-canvas-soft text-mute border-border"
            }`}
          >
            <Users className="w-3 h-3" />
            <span>
              {t("explore.playersNearby", { count: nearbyPlayersCount })}
            </span>
          </button>
        )}
      </div>
    </>
  );
};
