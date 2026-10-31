"use client";

import React from "react";
import { UserProfile, SportPassportItem } from "@/types/models";
import { mockUserProfile } from "@/lib/mockData";
import { useTranslation } from "@/hooks/useTranslation";
import { usePersistentState } from "@/hooks/usePersistentState";
import { KarmaIdentityCard } from "./KarmaIdentityCard";
import { SportSkillMatrix } from "./SportSkillMatrix";
import { WeeklyAvailabilityGrid } from "./WeeklyAvailabilityGrid";

export const PassportSection: React.FC = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = usePersistentState<UserProfile>(
    "teamup_user_profile",
    mockUserProfile
  );

  const handleUpdateBio = (nextBio: string) => {
    setProfile((prev) => ({
      ...prev,
      bio: nextBio,
    }));
  };

  const handleAddSport = (newSport: SportPassportItem) => {
    setProfile((prev) => ({
      ...prev,
      sports: [...prev.sports, newSport],
    }));
  };

  const handleRemoveSport = (sportId: number) => {
    setProfile((prev) => ({
      ...prev,
      sports: prev.sports.filter((s) => s.id !== sportId),
    }));
  };

  const handleToggleDayStatus = (dayIndex: number) => {
    setProfile((prev) => {
      const updatedAvailability = prev.availability.map((item, idx) => {
        if (idx !== dayIndex) return item;

        if (item.statusType === "busy") {
          return {
            ...item,
            statusType: "preferred" as const,
            status: t("passport.statusPreferred"),
          };
        }
        if (item.statusType === "preferred") {
          return {
            ...item,
            statusType: "primary" as const,
            status: t("passport.statusPrimary"),
          };
        }
        return {
          ...item,
          statusType: "busy" as const,
          status: t("passport.statusBusy"),
        };
      });

      return {
        ...prev,
        availability: updatedAvailability,
      };
    });
  };

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <KarmaIdentityCard profile={profile} onUpdateBio={handleUpdateBio} />

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-canvas p-6 sm:p-7 rounded-[24px] border border-border space-y-6 shadow-sm transition-colors duration-200">
            <SportSkillMatrix
              sports={profile.sports}
              onAddSport={handleAddSport}
              onRemoveSport={handleRemoveSport}
            />

            <WeeklyAvailabilityGrid
              availability={profile.availability}
              onToggleDayStatus={handleToggleDayStatus}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
