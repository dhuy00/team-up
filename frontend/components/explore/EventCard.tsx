"use client";

import React from "react";
import { MapPin, Clock, Tag, Check, X } from "lucide-react";
import { EventActivity } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";

interface EventCardProps {
  event: EventActivity;
  onSelectDetails: (event: EventActivity) => void;
  onToggleJoin: (eventId: number) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onSelectDetails,
  onToggleJoin,
}) => {
  const { t } = useTranslation();

  const spotsLeft = event.maxPlayers - event.confirmedPlayers;
  const progressPercent = (event.confirmedPlayers / event.maxPlayers) * 100;
  const isFull = spotsLeft <= 0;

  return (
    <div className="bg-canvas rounded-[24px] border border-border p-6 transition duration-150 flex flex-col justify-between group shadow-sm hover:border-ink/50">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-canvas-soft text-ink text-xs font-semibold rounded-full border border-border flex items-center gap-1.5">
              <span>{event.icon}</span>
              <span>{event.sport}</span>
            </span>
            <span className="px-2.5 py-0.5 bg-canvas-soft text-body text-[11px] font-medium rounded-full">
              {event.skill}
            </span>
            {event.userJoined && (
              <span className="px-2.5 py-0.5 bg-primary-pale text-positive-deep border border-primary-neutral text-[11px] font-bold rounded-full inline-flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[2.5]" />
                <span>{t("common.joined")}</span>
              </span>
            )}
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-semibold text-ink">
              {t("explore.distanceAway", { distance: event.distanceKm })}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-[900] text-ink mb-2 leading-snug">
          {event.title}
        </h3>

        {/* Venue & Details */}
        <div className="space-y-1.5 text-xs text-body mb-5">
          <div className="flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-mute shrink-0" />
            <span>{event.venue}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-mute shrink-0" />
            <span className="font-medium text-ink">{event.dateTimeStr}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Tag className="w-3.5 h-3.5 text-mute shrink-0" />
            <span>{event.cost}</span>
          </div>
        </div>
      </div>

      {/* Footer: Capacity & CTA Buttons */}
      <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
        {/* Spot Tracker */}
        <div className="flex-1 max-w-[200px]">
          <div className="flex justify-between text-[11px] font-semibold mb-1.5">
            <span className={isFull ? "text-negative font-bold" : "text-body"}>
              {isFull
                ? t("common.waitlistOnly")
                : t("common.spotsRemaining", { count: spotsLeft })}
            </span>
            <span className="text-mute font-mono">
              {event.confirmedPlayers}/{event.maxPlayers}
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
            onClick={() => onSelectDetails(event)}
            className="px-4 py-2 bg-canvas-soft hover:bg-canvas text-ink text-xs font-semibold rounded-[24px] border border-border transition cursor-pointer"
          >
            {t("common.details")}
          </button>

          {event.userJoined ? (
            <button
              onClick={() => onToggleJoin(event.id)}
              className="px-5 py-2 bg-canvas hover:bg-negative/10 text-negative border border-negative/40 hover:border-negative text-xs font-semibold rounded-[24px] transition flex items-center space-x-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t("common.cancel")}</span>
            </button>
          ) : (
            <button
              onClick={() => onToggleJoin(event.id)}
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
};
