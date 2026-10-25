"use client";

import React from "react";
import { EventActivity } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";

export interface RadarVisualFeedProps {
  events: EventActivity[];
  onSelectEvent: (event: EventActivity) => void;
}

export const RadarVisualFeed: React.FC<RadarVisualFeedProps> = ({
  events,
  onSelectEvent,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-canvas-soft rounded-[16px] p-4 border border-border space-y-3">
      <div className="text-xs text-body font-semibold flex items-center justify-between">
        <span>{t("explore.activeVenuesNearby")}</span>
        <span className="text-primary-deep text-[10px] font-bold uppercase bg-primary-pale px-2 py-0.5 rounded-full border border-primary-neutral">
          {t("explore.liveRadar")}
        </span>
      </div>

      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1.5 custom-scrollbar">
        {events.map((ev) => (
          <div
            key={ev.id}
            onClick={() => onSelectEvent(ev)}
            className="p-3 bg-canvas hover:bg-canvas-soft/80 border border-border rounded-[14px] cursor-pointer transition flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary text-ink border border-ink flex items-center justify-center font-bold text-sm shadow-xs">
                {ev.icon}
              </div>
              <div>
                <div className="font-bold text-xs text-ink line-clamp-1">{ev.title}</div>
                <div className="text-[11px] text-mute flex items-center gap-1">
                  <span>{ev.venue}</span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-mono font-bold text-ink block">
                {t("explore.distanceShort", { distance: ev.distanceKm })}
              </span>
              <span className="text-[10px] text-positive-deep font-semibold">
                {ev.confirmedPlayers}/{ev.maxPlayers}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RadarVisualFeed;
