"use client";

import React, { useState } from "react";
import { X, Check, MapPin, Trophy, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import {
  DEFAULT_SPORT_FILTER,
  SIMULATED_API_SPORTS,
  getSportIcon,
} from "@/constants/explore";
import { computeNextAvailability } from "@/services/passport";
import { mockUserProfile } from "@/lib/mockData";
import type { SportPassportItem, UserProfile } from "@/types/models";

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

export const OnboardingWizardModal: React.FC = () => {
  const { t } = useTranslation();
  const { user, isOnboardingOpen, setIsOnboardingOpen, completeOnboarding } =
    useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [location, setLocation] = useState(
    user?.profile.location || "Downtown • 5km radius"
  );
  const [bio, setBio] = useState(
    user?.profile.bio ||
      "Reliable team player looking for weekly pickup games!"
  );
  const [selectedSports, setSelectedSports] = useState<
    Record<string, { skillTier: string; role: string }>
  >({
    Soccer: { skillTier: "Intermediate", role: "Midfielder / All-Rounder" },
    Badminton: { skillTier: "Intermediate", role: "Doubles Partner" },
  });
  const [availability, setAvailability] = useState<
    UserProfile["availability"]
  >(() => structuredClone(user?.profile.availability || mockUserProfile.availability));

  useLockBodyScroll(isOnboardingOpen);

  if (!isOnboardingOpen) return null;

  const toggleSportSelection = (sportValue: string) => {
    setSelectedSports((prev) => {
      const next = { ...prev };
      if (next[sportValue]) {
        if (Object.keys(next).length <= 1) return prev;
        delete next[sportValue];
      } else {
        next[sportValue] = {
          skillTier: "Intermediate",
          role: "All-Rounder",
        };
      }
      return next;
    });
  };

  const updateSportTier = (sportValue: string, skillTier: string) => {
    setSelectedSports((prev) => ({
      ...prev,
      [sportValue]: {
        ...(prev[sportValue] || { role: "All-Rounder" }),
        skillTier,
      },
    }));
  };

  const updateSportRole = (sportValue: string, role: string) => {
    setSelectedSports((prev) => ({
      ...prev,
      [sportValue]: {
        ...(prev[sportValue] || { skillTier: "Intermediate" }),
        role,
      },
    }));
  };

  const handleToggleDay = (dayIndex: number) => {
    setAvailability((prev) =>
      computeNextAvailability(prev, dayIndex, {
        busy: t("passport.statusBusy"),
        preferred: t("passport.statusPreferred"),
        primary: t("passport.statusPrimary"),
      })
    );
  };

  const handleFinish = async () => {
    const sportsList: SportPassportItem[] = Object.entries(selectedSports).map(
      ([sportName, cfg], idx) => ({
        id: Date.now() + idx,
        name: sportName,
        icon: getSportIcon(sportName),
        role: cfg.role || "All-Rounder",
        skillTier: cfg.skillTier,
        verifications: t("passport.selfAssessed"),
      })
    );

    await completeOnboarding({
      location,
      bio,
      sports: sportsList,
      availability,
    });
    setStep(1);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-wizard-title"
    >
      <div className="bg-canvas rounded-[24px] max-w-xl w-full px-6 sm:px-7 border border-border shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar transition-colors duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-canvas pt-5 sm:pt-6 pb-4 border-b border-border flex items-start justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 bg-primary text-ink text-xs font-bold rounded-full uppercase">
              {t("onboarding.badge")}
            </span>
            <h3
              id="onboarding-wizard-title"
              className="text-xl sm:text-2xl font-[900] text-ink mt-1.5 tracking-tight"
            >
              {t("onboarding.title")}
            </h3>
            <p className="text-xs text-body mt-1">{t("onboarding.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOnboardingOpen(false)}
            aria-label={t("common.close")}
            className="p-2 bg-canvas-soft hover:bg-border/60 text-mute hover:text-ink rounded-full transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Pills */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 1, label: t("onboarding.stepLocation"), icon: MapPin },
            { id: 2, label: t("onboarding.stepSports"), icon: Trophy },
            { id: 3, label: t("onboarding.stepAvailability"), icon: Calendar },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = step === item.id;
            const isDone = step > item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStep(item.id as 1 | 2 | 3)}
                className={`p-2.5 rounded-[14px] border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  isActive
                    ? "bg-ink text-canvas border-ink"
                    : isDone
                      ? "bg-primary-pale text-positive-deep border-primary-neutral"
                      : "bg-canvas-soft text-mute border-border"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Step 1: Home Location & Bio */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink uppercase mb-1">
                {t("onboarding.homeLocationLabel")}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("onboarding.homeLocationPlaceholder")}
                className="w-full h-11 px-3.5 bg-canvas-soft border border-border rounded-[12px] text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink uppercase mb-1">
                {t("onboarding.shortBioLabel")}
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t("onboarding.shortBioPlaceholder")}
                className="w-full p-3.5 bg-canvas-soft border border-border rounded-[12px] text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Top Sports & Self-Assessed Skill Tiers */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-xs font-bold text-ink uppercase">
              {t("onboarding.selectPrimarySports")}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SIMULATED_API_SPORTS.filter(
                (s) => s.value !== DEFAULT_SPORT_FILTER
              ).map((sport) => {
                const isSelected = Boolean(selectedSports[sport.value]);
                return (
                  <button
                    key={sport.value}
                    type="button"
                    onClick={() => toggleSportSelection(sport.value)}
                    className={`p-3 rounded-[14px] border text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? "bg-primary-pale/60 border-primary-neutral text-ink font-bold"
                        : "bg-canvas-soft border-border text-body hover:text-ink"
                    }`}
                  >
                    <span className="text-xs flex items-center gap-2">
                      <span>{sport.icon}</span>
                      <span>{sport.value}</span>
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-positive-deep shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {Object.entries(selectedSports).map(([sportName, cfg]) => (
                <div
                  key={sportName}
                  className="p-3.5 rounded-[14px] bg-canvas-soft border border-border space-y-2.5"
                >
                  <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <span>{getSportIcon(sportName)}</span>
                    <span>{sportName}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-mute uppercase mb-1">
                        {t("onboarding.preferredRoleLabel")}
                      </label>
                      <input
                        type="text"
                        value={cfg.role}
                        onChange={(e) =>
                          updateSportRole(sportName, e.target.value)
                        }
                        className="w-full h-9 px-3 bg-canvas border border-border rounded-[10px] text-xs text-ink"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-mute uppercase mb-1">
                        {t("onboarding.skillTierLabel")}
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {SKILL_LEVELS.map((tier) => (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => updateSportTier(sportName, tier)}
                            className={`h-9 px-2 rounded-[8px] text-[10px] font-bold border transition cursor-pointer ${
                              cfg.skillTier === tier
                                ? "bg-ink text-primary border-ink"
                                : "bg-canvas text-body border-border"
                            }`}
                          >
                            {tier}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Weekly Availability */}
        {step === 3 && (
          <div className="space-y-3">
            <div>
              <div className="text-xs font-bold text-ink uppercase">
                {t("onboarding.weeklyScheduleTitle")}
              </div>
              <p className="text-[11px] text-mute mt-0.5">
                {t("onboarding.weeklyScheduleHint")}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {availability.map((slot, idx) => {
                const badgeClass =
                  slot.statusType === "primary"
                    ? "bg-primary text-ink border-ink font-bold"
                    : slot.statusType === "preferred"
                      ? "bg-primary-pale text-positive-deep border-primary-neutral font-bold"
                      : "bg-canvas-soft text-mute border-border";
                return (
                  <button
                    key={slot.day}
                    type="button"
                    onClick={() => handleToggleDay(idx)}
                    className={`p-3 rounded-[14px] border text-center transition cursor-pointer ${badgeClass}`}
                  >
                    <div className="text-xs font-black uppercase">
                      {slot.day}
                    </div>
                    <div className="text-[11px] mt-1">{slot.status}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sticky Footer Navigation */}
        <div className="sticky bottom-0 z-10 bg-canvas pt-4 pb-5 sm:pb-6 border-t border-border flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              className="px-5 py-2.5 bg-canvas-soft hover:bg-border/60 text-ink font-semibold rounded-[24px] border border-border text-xs sm:text-sm cursor-pointer"
            >
              {t("onboarding.backBtn")}
            </button>
          ) : (
            <span />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
              className="btn-primary px-6 py-2.5 rounded-[24px] text-xs sm:text-sm font-semibold cursor-pointer shadow-sm"
            >
              {t("onboarding.nextStepBtn")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="btn-primary px-6 py-2.5 rounded-[24px] text-xs sm:text-sm font-semibold cursor-pointer shadow-sm"
            >
              {t("onboarding.finishBtn")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
