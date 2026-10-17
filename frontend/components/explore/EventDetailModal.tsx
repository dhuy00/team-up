"use client";

import React from "react";
import Image from "next/image";
import { X, MapPin, Clock, Tag, Award, Check } from "lucide-react";
import { EventActivity } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";

interface EventDetailModalProps {
  event: EventActivity | null;
  onClose: () => void;
  onToggleJoin: (eventId: number) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onToggleJoin,
}) => {
  const { t } = useTranslation();

  if (!event) return null;

  const spotsLeft = event.maxPlayers - event.confirmedPlayers;
  const isFull = spotsLeft <= 0;

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-canvas rounded-[24px] max-w-xl w-full p-6 sm:p-7 border border-border shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto transition-colors duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 bg-canvas-soft text-ink text-xs font-semibold rounded-full border border-border">
                {event.icon} {event.sport}
              </span>
              <span className="px-2.5 py-0.5 bg-canvas-soft text-body text-xs font-medium rounded-full">
                {event.skill}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-[900] text-ink tracking-tight">
              {event.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-mute hover:text-ink rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Host Summary Card */}
        <div className="flex items-center justify-between p-4 bg-canvas-soft rounded-[16px] border border-border">
          <div className="flex items-center space-x-3">
            <div className="relative w-11 h-11">
              <Image
                src={event.host.avatar}
                alt={event.host.name}
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover border border-ink"
                unoptimized
              />
            </div>
            <div>
              <div className="text-xs text-mute font-semibold uppercase">Event Host</div>
              <div className="font-bold text-sm text-ink">{event.host.name}</div>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-primary-pale text-positive-deep border border-primary-neutral rounded-full text-xs font-bold">
            <Award className="w-3.5 h-3.5" />
            <span>{event.host.karma}% Karma</span>
          </div>
        </div>

        {/* Match Logistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          <div className="p-3 bg-canvas-soft rounded-[12px] flex items-center space-x-2.5">
            <MapPin className="w-4 h-4 text-mute shrink-0" />
            <div>
              <span className="block text-[11px] text-mute uppercase font-semibold">Location</span>
              <span className="font-semibold text-ink">{event.venue}</span>
            </div>
          </div>

          <div className="p-3 bg-canvas-soft rounded-[12px] flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-mute shrink-0" />
            <div>
              <span className="block text-[11px] text-mute uppercase font-semibold">Schedule</span>
              <span className="font-semibold text-ink">{event.dateTimeStr}</span>
            </div>
          </div>

          <div className="p-3 bg-canvas-soft rounded-[12px] flex items-center space-x-2.5">
            <Tag className="w-4 h-4 text-mute shrink-0" />
            <div>
              <span className="block text-[11px] text-mute uppercase font-semibold">Fee</span>
              <span className="font-semibold text-ink">{event.cost}</span>
            </div>
          </div>

          <div className="p-3 bg-canvas-soft rounded-[12px] flex items-center space-x-2.5">
            <div className="text-xs font-bold text-ink shrink-0">👥</div>
            <div>
              <span className="block text-[11px] text-mute uppercase font-semibold">Capacity</span>
              <span className="font-semibold text-ink">
                {event.confirmedPlayers} of {event.maxPlayers} Spots Filled
              </span>
            </div>
          </div>
        </div>

        {/* Host Notes */}
        {event.notes && (
          <div className="p-3.5 rounded-[12px] bg-canvas-soft/60 border border-border text-xs text-body">
            <span className="font-bold text-ink block mb-0.5">Host Notes:</span>
            {event.notes}
          </div>
        )}

        {/* Confirmed Roster */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-mute">
              Confirmed Roster ({event.roster.length})
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {event.roster.map((player, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2.5 bg-canvas-soft rounded-[12px] text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-ink text-canvas flex items-center justify-center font-bold text-[10px]">
                    {player.name.charAt(0)}
                  </span>
                  <span className="font-semibold text-ink">{player.name}</span>
                  <span className="text-mute text-[11px]">({player.role})</span>
                </div>
                <span className="font-mono text-[11px] font-bold text-positive-deep bg-primary-pale px-2 py-0.5 rounded-full border border-primary-neutral">
                  {player.karma}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Action CTA */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-body font-semibold hover:text-ink transition cursor-pointer text-sm"
          >
            {t("common.cancel")}
          </button>

          <button
            onClick={() => onToggleJoin(event.id)}
            className={`px-6 py-2.5 rounded-[24px] text-sm font-semibold transition cursor-pointer shadow-sm flex items-center space-x-2 ${
              event.userJoined
                ? "bg-canvas text-negative border border-negative hover:bg-negative/10"
                : isFull
                ? "bg-ink text-canvas hover:bg-ink/80"
                : "btn-primary"
            }`}
          >
            {event.userJoined ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Leave Game Spot</span>
              </>
            ) : isFull ? (
              <span>Join Waitlist</span>
            ) : (
              <span>{t("common.rsvpSpot")}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
