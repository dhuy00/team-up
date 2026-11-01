"use client";

import React, { useMemo } from "react";
import { usePassport } from "@/hooks/usePassport";
import { KarmaIdentityCard } from "./KarmaIdentityCard";
import { SportSkillMatrix } from "./SportSkillMatrix";
import { WeeklyAvailabilityGrid } from "./WeeklyAvailabilityGrid";

interface PassportSectionProps {
  username?: string;
}

export const PassportSection: React.FC<PassportSectionProps> = ({
  username,
}) => {
  const { profile, updateBio, addSport, removeSport, toggleDayStatus } =
    usePassport();

  const resolvedProfile = useMemo(() => {
    if (!username) return profile;
    const decoded = decodeURIComponent(username).replace(/^@/, "");
    if (
      decoded.toLowerCase() === "alexmorgan" ||
      decoded.toLowerCase() ===
        profile.username.replace(/^@/, "").toLowerCase()
    ) {
      return profile;
    }
    const formattedName = decoded
      .split(/[-_.]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    return {
      ...profile,
      name: formattedName || decoded,
      username: `@${decoded.toLowerCase()}`,
    };
  }, [profile, username]);

  return (
    <section>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <KarmaIdentityCard
          profile={resolvedProfile}
          onUpdateBio={updateBio}
        />

        <div className="lg:col-span-8 relative flex flex-col">
          <div className="bg-canvas p-5 sm:p-6 rounded-[24px] border border-border lg:absolute lg:inset-0 flex-1 flex flex-col gap-4 shadow-sm transition-colors duration-200 overflow-hidden">
            <SportSkillMatrix
              sports={resolvedProfile.sports}
              onAddSport={addSport}
              onRemoveSport={removeSport}
            />

            <WeeklyAvailabilityGrid
              availability={resolvedProfile.availability}
              onToggleDayStatus={toggleDayStatus}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
