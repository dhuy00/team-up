"use client";

import React, { useState, useMemo } from "react";
import { Search, MapPin, Clock, Tag, Check, ArrowRight } from "lucide-react";
import { EventActivity } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";
import { EventDetailModal } from "./EventDetailModal";
import { RadarVisualFeed } from "./RadarVisualFeed";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  SIMULATED_API_SPORTS,
  SKILL_OPTIONS,
  DISTANCE_FILTER_CONFIG,
  DEFAULT_SPORT_FILTER,
  DEFAULT_SKILL_FILTER,
} from "@/constants/explore";

interface ExploreSectionProps {
  events: EventActivity[];
  onToggleJoin: (eventId: number) => void;
  selectedSport: string;
  selectedRadius: number;
  onSportChange: (sport: string) => void;
  onRadiusChange: (distanceKm: number) => void;
}

export const ExploreSection: React.FC<ExploreSectionProps> = ({
  events,
  onToggleJoin,
  selectedSport,
  selectedRadius,
  onSportChange,
  onRadiusChange,
}) => {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterSkill, setFilterSkill] = useState(DEFAULT_SKILL_FILTER);
  const [selectedEventForModal, setSelectedEventForModal] = useState<EventActivity | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Search
      const matchesSearch =
        searchTerm === "" ||
        ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.sport.toLowerCase().includes(searchTerm.toLowerCase());

      // Sport
      const matchesSport =
        selectedSport === DEFAULT_SPORT_FILTER ||
        ev.sport.toLowerCase() === selectedSport.toLowerCase();

      // Skill
      const matchesSkill =
        filterSkill === DEFAULT_SKILL_FILTER ||
        ev.skill.toLowerCase() === filterSkill.toLowerCase();

      // Distance
      const matchesDistance = ev.distanceKm <= selectedRadius;

      return matchesSearch && matchesSport && matchesSkill && matchesDistance;
    });
  }, [events, searchTerm, selectedSport, filterSkill, selectedRadius]);

  const handleResetFilters = () => {
    setSearchTerm("");
    onSportChange(DEFAULT_SPORT_FILTER);
    setFilterSkill(DEFAULT_SKILL_FILTER);
    onRadiusChange(DISTANCE_FILTER_CONFIG.DEFAULT);
  };

  const sportOptions = useMemo(
    () =>
      SIMULATED_API_SPORTS.map((s) => ({
        value: s.value,
        label: t(s.labelKey as any) || s.fallbackLabel,
        icon: s.icon,
      })),
    [t]
  );

  const skillOptions = useMemo(
    () =>
      SKILL_OPTIONS.map((sk) => ({
        value: sk.value,
        label: t(sk.labelKey as any) || sk.fallbackLabel,
      })),
    [t]
  );

  return (
    <section id="explore-section" className="space-y-6 scroll-mt-24">
      
      {/* Search & Filters Container */}
      <div className="bg-canvas p-6 rounded-[24px] border border-border space-y-4 shadow-sm transition-colors duration-200">
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-4 top-3 text-mute" />
            <input
              type="text"
              placeholder={t("explore.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-canvas-soft border border-border rounded-[12px] text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none transition"
            />
          </div>

          {/* Filter Dropdowns using CustomSelect */}
          <div className="flex flex-wrap items-center gap-2">
            <CustomSelect
              options={sportOptions}
              value={selectedSport}
              onChange={(val) => onSportChange(val)}
              className="w-44"
              triggerClassName="py-2.5 px-3 text-xs"
            />

            <CustomSelect
              options={skillOptions}
              value={filterSkill}
              onChange={(val) => setFilterSkill(val)}
              className="w-40"
              triggerClassName="py-2.5 px-3 text-xs"
            />
          </div>
        </div>

        {/* Secondary Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-body pt-3 border-t border-border">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-ink">{t("explore.maxDistance")}:</span>
            <input
              type="range"
              min={DISTANCE_FILTER_CONFIG.MIN}
              max={DISTANCE_FILTER_CONFIG.MAX}
              step={DISTANCE_FILTER_CONFIG.STEP}
              value={selectedRadius}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className="w-32 accent-ink cursor-pointer"
            />
            <span className="font-semibold text-ink bg-canvas-soft px-2.5 py-1 rounded-full border border-border">
              {t("explore.distanceWithin", { distance: selectedRadius })}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span>
              {t("explore.matchesAvailable", { count: filteredEvents.length })}
            </span>
            <button
              onClick={handleResetFilters}
              className="text-ink font-semibold underline hover:text-mute cursor-pointer"
            >
              {t("explore.resetFilters")}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Split: Event Cards Feed + Local Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Event Cards Feed */}
        <div className="lg:col-span-7 space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="bg-canvas p-12 text-center rounded-[24px] border border-border shadow-sm">
              <h4 className="font-[900] text-lg text-ink">
                {t("explore.noActivitiesFound")}
              </h4>
              <p className="text-xs text-body mt-1">
                {t("explore.noActivitiesHint")}
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 px-6 py-2.5 btn-primary font-semibold rounded-[24px] text-xs shadow-xs"
              >
                {t("explore.resetFilters")}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((ev) => {
                const spotsLeft = ev.maxPlayers - ev.confirmedPlayers;
                const progressPercent = (ev.confirmedPlayers / ev.maxPlayers) * 100;
                const isFull = spotsLeft <= 0;

                return (
                  <div
                    key={ev.id}
                    className="bg-canvas rounded-[24px] border border-border p-6 transition duration-150 flex flex-col justify-between group shadow-sm hover:border-ink/50"
                  >
                    <div>
                      {/* Header Badges */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 bg-canvas-soft text-ink text-xs font-semibold rounded-full border border-border flex items-center gap-1.5">
                            <span>{ev.icon}</span>
                            <span>{ev.sport}</span>
                          </span>
                          <span className="px-2.5 py-0.5 bg-canvas-soft text-body text-[11px] font-medium rounded-full">
                            {ev.skill}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-ink">
                            {t("explore.distanceAway", { distance: ev.distanceKm })}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => setSelectedEventForModal(ev)}
                        className="text-lg font-[900] text-ink hover:text-mute transition cursor-pointer mb-2 leading-snug"
                      >
                        {ev.title}
                      </h3>

                      {/* Venue & Details */}
                      <div className="space-y-1.5 text-xs text-body mb-5">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-mute shrink-0" />
                          <span>{ev.venue}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3.5 h-3.5 text-mute shrink-0" />
                          <span className="font-medium text-ink">{ev.dateTimeStr}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Tag className="w-3.5 h-3.5 text-mute shrink-0" />
                          <span>{ev.cost}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Capacity & CTA Buttons */}
                    <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
                      {/* Spot Tracker */}
                      <div className="flex-1 max-w-[200px]">
                        <div className="flex justify-between text-[11px] font-semibold mb-1.5">
                          <span className={isFull ? "text-negative font-bold" : "text-body"}>
                            {isFull ? t("common.waitlistOnly") : t("common.spotsRemaining", { count: spotsLeft })}
                          </span>
                          <span className="text-mute font-mono">
                            {ev.confirmedPlayers}/{ev.maxPlayers}
                          </span>
                        </div>
                        <div className="w-full bg-canvas-soft rounded-full h-2 overflow-hidden border border-border">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isFull ? "bg-negative" : "bg-ink"
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedEventForModal(ev)}
                          className="px-4 py-2 bg-canvas-soft hover:bg-canvas text-ink text-xs font-semibold rounded-[24px] border border-border transition cursor-pointer"
                        >
                          {t("common.details")}
                        </button>

                        {ev.userJoined ? (
                          <button
                            onClick={() => onToggleJoin(ev.id)}
                            className="px-5 py-2 bg-primary-pale hover:bg-negative/10 hover:text-negative text-positive-deep border border-primary-neutral text-xs font-semibold rounded-[24px] transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{t("common.joined")}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onToggleJoin(ev.id)}
                            className={`px-5 py-2 text-xs font-semibold rounded-[24px] transition cursor-pointer shadow-sm ${
                              isFull
                                ? "bg-canvas text-ink border border-ink hover:bg-canvas-soft"
                                : "btn-primary"
                            }`}
                          >
                            {isFull ? t("common.waitlistOnly") : t("common.rsvpSpot")}
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Local Game Radar Card */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-canvas p-5 rounded-[24px] border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-ink" />
                {t("explore.localRadar")}
              </span>
              <span className="text-xs text-mute font-mono">
                {t("explore.pinsActive", { count: filteredEvents.length })}
              </span>
            </div>

            {/* Radar Visual Feed */}
            <RadarVisualFeed
              events={filteredEvents}
              onSelectEvent={setSelectedEventForModal}
            />

            <div className="text-[11px] text-mute text-center">
              {t("explore.radarHint")}
            </div>
          </div>
        </div>

      </div>

      {/* Details Modal */}
      {selectedEventForModal && (
        <EventDetailModal
          event={selectedEventForModal}
          onClose={() => setSelectedEventForModal(null)}
          onToggleJoin={(id) => {
            onToggleJoin(id);
            setSelectedEventForModal((prev) =>
              prev && prev.id === id ? { ...prev, userJoined: !prev.userJoined, confirmedPlayers: prev.userJoined ? prev.confirmedPlayers - 1 : prev.confirmedPlayers + 1 } : prev
            );
          }}
        />
      )}

    </section>
  );
};
