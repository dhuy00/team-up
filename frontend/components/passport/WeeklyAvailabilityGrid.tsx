"use client";

import React from "react";
import { UserProfile } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";

interface WeeklyAvailabilityGridProps {
  availability: UserProfile["availability"];
  onToggleDayStatus: (dayIndex: number) => void;
}

export const WeeklyAvailabilityGrid: React.FC<WeeklyAvailabilityGridProps> = ({
  availability,
  onToggleDayStatus,
}) => {
  const { t } = useTranslation();

  return (
    <div className="pt-4 border-t border-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
        <h4 className="text-xs font-[900] text-ink uppercase tracking-wider">
          {t("passport.availabilityTitle")}
        </h4>
        <span className="text-[11px] text-mute">
          {t("passport.availabilityHint")}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-center text-xs">
        {availability.map((item, idx) => {
          let styleClass =
            "bg-canvas-soft text-mute font-medium border border-border hover:border-ink/50";
          if (item.statusType === "preferred") {
            styleClass =
              "bg-primary-pale text-positive-deep font-semibold border border-primary-neutral hover:border-ink";
          } else if (item.statusType === "primary") {
            styleClass =
              "bg-primary text-ink font-bold border border-ink shadow-xs";
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onToggleDayStatus(idx)}
              className={`p-2.5 rounded-[12px] transition cursor-pointer ${styleClass}`}
            >
              <div>{item.day}</div>
              <span className="text-[10px] block mt-0.5">{item.status}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
