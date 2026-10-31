"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { X, MapPin, Clock, Tag, Award, Check, MessageSquare } from "lucide-react";
import { EventActivity } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";

interface EventDetailModalProps {
  event: EventActivity | null;
  onClose: () => void;
  onToggleJoin: (eventId: number) => void;
  onOpenMatchChat?: (event: EventActivity) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onToggleJoin,
  onOpenMatchChat,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!event) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [event, onClose]);

  if (!event) return null;

  const spotsLeft = event.maxPlayers - event.confirmedPlayers;
  const isFull = spotsLeft <= 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-detail-title"
    >
      <div className="bg-canvas rounded-[24px] max-w-2xl w-full px-6 sm:px-7 border border-border shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar transition-colors duration-200">
        {/* Sticky Header with Close Button */}
        <div className="sticky top-0 z-10 bg-canvas pt-5 sm:pt-6 pb-4 border-b border-border flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-canvas-soft text-ink text-xs font-semibold rounded-full border border-border">
                {event.icon} {event.sport}
              </span>
              <span className="px-2.5 py-0.5 bg-canvas-soft text-body text-xs font-medium rounded-full">
                {event.skill}
              </span>
              {event.userJoined && (
                <span className="px-2.5 py-0.5 bg-primary-pale text-positive-deep border border-primary-neutral text-xs font-bold rounded-full inline-flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span>{t("common.joined")}</span>
                </span>
              )}
            </div>
            <h3
              id="event-detail-title"
              className="text-xl sm:text-2xl font-[900] text-ink tracking-tight"
            >
              {event.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="sticky top-5 p-2 bg-canvas-soft hover:bg-border/60 text-mute hover:text-ink rounded-full transition cursor-pointer shrink-0"
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
              <div className="text-xs text-mute font-semibold uppercase">
                {t("eventDetail.eventHost")}
              </div>
              <div className="font-bold text-sm text-ink">
                {event.host.name}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-primary-pale text-positive-deep border border-primary-neutral rounded-full text-xs font-bold">
            <Award className="w-3.5 h-3.5" />
            <span>
              {t("eventDetail.karmaPercent", { karma: event.host.karma })}
            </span>
          </div>
        </div>

        {/* Match Logistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          <div className="p-3 bg-canvas-soft rounded-[12px] flex items-center space-x-2.5">
            <MapPin className="w-4 h-4 text-mute shrink-0" />
            <div>
              <span className="block text-[11px] text-mute uppercase font-semibold">
                {t("eventDetail.location")}
              </span>
              <span className="font-semibold text-ink">{event.venue}</span>
            </div>
          </div>

          <div className="p-3 bg-canvas-soft rounded-[12px] flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-mute shrink-0" />
            <div>
              <span className="block text-[11px] text-mute uppercase font-semibold">
                {t("eventDetail.schedule")}
              </span>
              <span className="font-semibold text-ink">
                {event.dateTimeStr}
              </span>
            </div>
          </div>

          <div className="p-3 bg-canvas-soft rounded-[12px] flex items-center space-x-2.5">
            <Tag className="w-4 h-4 text-mute shrink-0" />
            <div>
              <span className="block text-[11px] text-mute uppercase font-semibold">
                {t("eventDetail.fee")}
              </span>
              <span className="font-semibold text-ink">{event.cost}</span>
            </div>
          </div>

          <div className="p-3 bg-canvas-soft rounded-[12px] flex items-center space-x-2.5">
            <div className="text-xs font-bold text-ink shrink-0">👥</div>
            <div>
              <span className="block text-[11px] text-mute uppercase font-semibold">
                {t("eventDetail.capacity")}
              </span>
              <span className="font-semibold text-ink">
                {t("eventDetail.spotsFilled", {
                  confirmed: event.confirmedPlayers,
                  max: event.maxPlayers,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Host Notes */}
        {event.notes && (
          <div className="p-3.5 rounded-[12px] bg-canvas-soft/60 border border-border text-xs text-body">
            <span className="font-bold text-ink block mb-0.5">
              {t("eventDetail.hostNotes")}
            </span>
            {event.notes}
          </div>
        )}

        {/* Confirmed Roster */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-mute">
              {t("eventDetail.confirmedRoster", { count: event.roster.length })}
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
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

        {/* Sticky Modal Action CTA */}
        <div className="sticky bottom-0 z-10 bg-canvas pt-4 pb-5 sm:pb-6 border-t border-border flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-canvas-soft hover:bg-border/60 text-ink font-semibold rounded-[24px] border border-border transition cursor-pointer text-sm"
          >
            {t("common.close")}
          </button>

          {onOpenMatchChat && (
            <button
              type="button"
              onClick={() => onOpenMatchChat(event)}
              className="px-5 py-2.5 bg-canvas hover:bg-canvas-soft text-ink font-semibold rounded-[24px] border border-ink transition cursor-pointer text-sm flex items-center space-x-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t("eventDetail.openMatchChat")}</span>
            </button>
          )}

          <button
            type="button"
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
                <X className="w-4 h-4 stroke-[2.5]" />
                <span>{t("eventDetail.leaveSpot")}</span>
              </>
            ) : isFull ? (
              <span>{t("eventDetail.joinWaitlist")}</span>
            ) : (
              <span>{t("common.rsvpSpot")}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
