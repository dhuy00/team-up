"use client";

import React, { useMemo } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  DISTANCE_FILTER_CONFIG,
  buildSportSelectOptions,
  buildSkillSelectOptions,
} from "@/constants/explore";

interface ExploreFilterBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedSport: string;
  onSportChange: (sport: string) => void;
  filterSkill: string;
  onSkillChange: (skill: string) => void;
  selectedRadius: number;
  onRadiusChange: (distanceKm: number) => void;
  matchesCount: number;
  onResetFilters: () => void;
}

export const ExploreFilterBar: React.FC<ExploreFilterBarProps> = ({
  searchTerm,
  onSearchTermChange,
  selectedSport,
  onSportChange,
  filterSkill,
  onSkillChange,
  selectedRadius,
  onRadiusChange,
  matchesCount,
  onResetFilters,
}) => {
  const { t } = useTranslation();

  const sportOptions = useMemo(() => buildSportSelectOptions(t), [t]);
  const skillOptions = useMemo(() => buildSkillSelectOptions(t), [t]);

  return (
    <div className="bg-canvas p-6 rounded-[24px] border border-border space-y-4 shadow-sm transition-colors duration-200">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-4 top-3 text-mute" />
          <input
            type="text"
            placeholder={t("explore.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-canvas-soft border border-border rounded-[12px] text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none transition"
          />
        </div>

        {/* Filter Dropdowns using CustomSelect */}
        <div className="flex flex-wrap items-center gap-2">
          <CustomSelect
            options={sportOptions}
            value={selectedSport}
            onChange={onSportChange}
            className="w-44"
            triggerClassName="py-2.5 px-3 text-xs"
          />

          <CustomSelect
            options={skillOptions}
            value={filterSkill}
            onChange={onSkillChange}
            className="w-40"
            triggerClassName="py-2.5 px-3 text-xs"
          />
        </div>
      </div>

      {/* Secondary Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-body pt-3 border-t border-border">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-ink">
            {t("explore.maxDistance")}:
          </span>
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
          <span>{t("explore.matchesAvailable", { count: matchesCount })}</span>
          <button
            onClick={onResetFilters}
            className="text-ink font-semibold underline hover:text-mute cursor-pointer"
          >
            {t("explore.resetFilters")}
          </button>
        </div>
      </div>
    </div>
  );
};
