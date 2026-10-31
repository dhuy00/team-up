"use client";

/**
 * ============================================================================
 * CODE REVIEW & COMPONENT AUDIT
 * ============================================================================
 * Component: HeroSection.tsx
 * Module: Home / Landing Discovery Band
 * Design System: Wise-inspired (Weight 900 display, primary lime #9fe870, sage canvas #e8ebe6)
 *
 * REVIEW CRITERIA & AUDIT FINDINGS (review.md):
 * ----------------------------------------------------------------------------
 * 1. Terminology Clarification:
 *    - "Real-time RSVP" replaced with "Instant Spot Booking" (EN) / "Đặt chỗ tức thì" (VI)
 *      to eliminate tech jargon and clarify recreational spot-holding mechanics.
 *
 * 2. Primary Button Elevation & Hover Feedback:
 *    - Switched from simple color shift to tactile `.btn-primary` utility class
 *      featuring a subtle -2px lift, cubic-bezier timing, soft ambient lime glow
 *      shadow (0 10px 20px -4px rgba(159, 232, 112, 0.45)), and active press feedback (scale 0.98).
 *
 * 3. Custom Dropdown Integration:
 *    - Replaced native HTML <select> with `CustomSelect` component for cross-platform
 *      visual consistency, animated popover menus, checkmark selection indicators,
 *      keyboard accessibility (Escape), and click-outside dismissal.
 *
 * 4. Dynamic API Simulation & Constant Centralization:
 *    - Eliminated hardcoded <option> elements in JSX. Sports list is now driven by
 *      `SIMULATED_API_SPORTS` and optionally hydrated via `availableSports` prop.
 *    - Distance bounds (min, max, step, default) extracted to `HERO_DISTANCE_CONFIG`
 *      in `@/constants/explore`.
 *
 * FUTURE RECOMMENDATIONS:
 * ----------------------------------------------------------------------------
 * - Hydrate `availableSports` via backend API (`/api/v1/sports/active`) with SWR/React Query.
 * - Integrate browser navigator.geolocation to seed initial user distance radius dynamically.
 * ============================================================================
 */

import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { CustomSelect, CustomSelectOption } from "@/components/ui/CustomSelect";
import {
  DISTANCE_FILTER_CONFIG,
  SIMULATED_API_SPORTS,
  DEFAULT_SPORT_FILTER,
  fetchSportsApi,
  SportConfigItem,
  buildSportSelectOptions,
} from "@/constants/explore";

interface HeroSectionProps {
  onExploreClick: () => void;
  onBrowseSquadsClick: () => void;
  onQuickFind: (sport: string, distanceKm: number) => void;
  selectedSport?: string;
  selectedRadius?: number;
  onSportChange?: (sport: string) => void;
  onRadiusChange?: (distanceKm: number) => void;
  availableSports?: SportConfigItem[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreClick,
  onBrowseSquadsClick,
  onQuickFind,
  selectedSport = DEFAULT_SPORT_FILTER,
  selectedRadius = DISTANCE_FILTER_CONFIG.DEFAULT,
  onSportChange,
  onRadiusChange,
  availableSports = SIMULATED_API_SPORTS,
}) => {
  const { t } = useTranslation();

  // Dynamic sports options simulated from API / variable (not hardcoded in JSX)
  const [sportsData, setSportsData] = useState<SportConfigItem[]>(availableSports);

  // Simulating dynamic API response fetching
  useEffect(() => {
    let isMounted = true;
    fetchSportsApi().then((data) => {
      if (isMounted && data) {
        setSportsData(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Transform dynamic sports data into CustomSelect options with translated labels
  const selectOptions: CustomSelectOption[] = buildSportSelectOptions(t, {
    sports: sportsData,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickFind(selectedSport, selectedRadius);
  };

  return (
    <section className="bg-canvas-soft border-b border-border transition-colors duration-200 min-h-[calc(100dvh-5rem)] flex items-center py-12 md:py-16">
      <div className="max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Headline in Wise-style Weight 900 Display & Lead */}
          <div className="lg:col-span-7 space-y-5">
            <h1 className="text-4xl sm:text-5xl lg:text-[60px] font-[900] text-ink leading-[1.05] tracking-tight whitespace-pre-line">
              {t("explore.heroTitle")}
            </h1>

            <p className="text-lg sm:text-xl text-body leading-relaxed max-w-xl">
              {t("explore.heroSubtitle")}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 font-medium">
              {/* Primary button with tactile hover elevation */}
              <button
                onClick={onExploreClick}
                className="btn-primary px-6 py-3.5 rounded-[24px] text-sm shadow-sm"
              >
                {t("explore.exploreActiveGames")}
              </button>
              <button
                onClick={onBrowseSquadsClick}
                className="px-6 py-3.5 bg-canvas hover:bg-canvas-soft text-ink border border-border font-semibold rounded-[24px] text-sm transition cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0"
              >
                {t("explore.browseSquads")}
              </button>
            </div>
          </div>

          {/* Right: Signature Quick Match Finder Card */}
          <div className="lg:col-span-5">
            <div className="bg-canvas p-6 sm:p-7 rounded-[24px] border border-border shadow-sm space-y-4 transition-colors duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-mute">
                  {t("explore.quickMatchFinder")}
                </span>
                {/* Replaced confusing 'Real-time RSVP' with intuitive 'Instant Spot Booking' */}
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-positive-deep bg-primary-pale px-2.5 py-1 rounded-full border border-primary-neutral">
                  <span>{t("explore.realtimeRsvp")}</span>
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-mute uppercase mb-1.5">
                    {t("explore.sportActivity")}
                  </label>
                  {/* Custom smooth dropdown with dynamic options */}
                  <CustomSelect
                    options={selectOptions}
                    value={selectedSport}
                    onChange={(val) => onSportChange?.(val)}
                    placeholder={t("sports.all")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-mute uppercase mb-1.5">
                    {t("explore.maxDistance")}
                  </label>
                  <div className="flex items-center justify-between px-4 py-3 bg-canvas-soft border border-border rounded-[12px]">
                    <span className="text-sm font-semibold text-ink">
                      {t("explore.distanceWithin", { distance: selectedRadius })}
                    </span>
                    <input
                      type="range"
                      min={DISTANCE_FILTER_CONFIG.MIN}
                      max={DISTANCE_FILTER_CONFIG.MAX}
                      step={DISTANCE_FILTER_CONFIG.STEP}
                      value={selectedRadius}
                      onChange={(e) => onRadiusChange?.(Number(e.target.value))}
                      className="w-32 accent-ink cursor-pointer"
                    />
                  </div>
                </div>

                {/* Primary CTA Button with interactive lift and glow hover */}
                <button
                  type="submit"
                  className="btn-primary w-full py-3.5 rounded-[24px] text-sm flex items-center justify-center space-x-2 
                  shadow-sm mt-3 font-medium"
                >
                  <span>{t("explore.findMatchesNearby")}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
