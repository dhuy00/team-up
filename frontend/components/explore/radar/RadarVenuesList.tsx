"use client";

import React from "react";
import { MapPin, Eye } from "lucide-react";
import { EventActivity } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";

interface RadarVenuesListProps {
  events: EventActivity[];
  locationLabel: string;
  selectedRadius: number;
  activeEventId: number | null;
  onFocusEventOnMap: (ev: EventActivity) => void;
  onSelectEvent: (ev: EventActivity) => void;
}

export const RadarVenuesList: React.FC<RadarVenuesListProps> = ({
  events,
  locationLabel,
  selectedRadius,
  activeEventId,
  onFocusEventOnMap,
  onSelectEvent,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-canvas-soft rounded-[18px] p-3.5 border border-border h-[340px] flex flex-col">
      <div className="text-xs text-body font-semibold flex items-center justify-between pb-2.5 mb-2.5 border-b border-border shrink-0">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-ink" />
          <span>{locationLabel}</span>
        </span>
        <span className="text-positive-deep text-[10px] font-bold uppercase bg-primary-pale px-2 py-0.5 rounded-full border border-primary-neutral">
          {t("explore.distanceWithin", { distance: selectedRadius })}
        </span>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs text-mute">
            <p className="font-bold text-ink">
              {t("explore.noActivitiesFound")}
            </p>
            <p className="mt-1">{t("explore.noActivitiesHint")}</p>
          </div>
        ) : (
          events.map((ev) => {
            const isSelected = activeEventId === ev.id;
            return (
              <div
                key={ev.id}
                onClick={() => onFocusEventOnMap(ev)}
                className={`p-3 bg-canvas hover:bg-canvas-soft/80 border rounded-[14px] cursor-pointer transition flex items-center justify-between gap-2 ${
                  isSelected
                    ? "border-ink ring-1 ring-ink"
                    : "border-border"
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary text-ink border border-ink flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    {ev.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-ink truncate">
                      {ev.title}
                    </div>
                    <div className="text-[11px] text-mute flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{ev.venue}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] font-mono font-bold text-ink block">
                      {t("explore.distanceShort", {
                        distance: ev.distanceKm,
                      })}
                    </span>
                    <span className="text-[10px] text-positive-deep font-semibold">
                      {ev.confirmedPlayers}/{ev.maxPlayers}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(ev);
                    }}
                    title={t("common.details")}
                    className="p-1.5 rounded-full bg-canvas-soft hover:bg-primary text-ink border border-border transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
