"use client";

import React, { useEffect } from "react";
import { X, Shield, MapPin, Users, Award, Check } from "lucide-react";
import { TeamSquad } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface SquadDetailModalProps {
  squad: TeamSquad | null;
  isRequested: boolean;
  onClose: () => void;
  onRequestInvite: (squadId: number) => void;
}

export const SquadDetailModal: React.FC<SquadDetailModalProps> = ({
  squad,
  isRequested,
  onClose,
  onRequestInvite,
}) => {
  const { t } = useTranslation();

  useLockBodyScroll(Boolean(squad));

  useEffect(() => {
    if (!squad) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [squad, onClose]);

  if (!squad) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="squad-detail-title"
    >
      <div className="bg-canvas rounded-[24px] max-w-lg w-full p-6 sm:p-7 border border-border shadow-2xl space-y-5 transition-colors duration-200">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-[16px] bg-ink text-primary font-[900] text-xl flex items-center justify-center shrink-0">
              {squad.abbr}
            </div>
            <div>
              <span className="px-2.5 py-0.5 bg-canvas-soft border border-border rounded-full text-[11px] font-bold text-ink">
                {squad.sport}
              </span>
              <h3
                id="squad-detail-title"
                className="text-2xl font-[900] text-ink tracking-tight mt-1"
              >
                {squad.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="p-2 bg-canvas-soft hover:bg-border/60 text-mute hover:text-ink rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-body leading-relaxed">
          {squad.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-canvas-soft rounded-[14px] border border-border flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-mute shrink-0" />
            <div>
              <span className="block text-[10px] text-mute uppercase font-semibold">
                {t("clubs.captainLabel")}
              </span>
              <span className="font-bold text-ink">{squad.captain}</span>
            </div>
          </div>

          <div className="p-3.5 bg-canvas-soft rounded-[14px] border border-border flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-mute shrink-0" />
            <div>
              <span className="block text-[10px] text-mute uppercase font-semibold">
                {t("clubs.homeVenueLabel")}
              </span>
              <span className="font-bold text-ink">{squad.venue}</span>
            </div>
          </div>

          <div className="p-3.5 bg-canvas-soft rounded-[14px] border border-border flex items-center gap-2.5">
            <Users className="w-4 h-4 text-mute shrink-0" />
            <div>
              <span className="block text-[10px] text-mute uppercase font-semibold">
                {t("eventDetail.capacity")}
              </span>
              <span className="font-bold text-ink">
                {t("clubs.membersCount", {
                  current: squad.memberCount,
                  max: squad.maxMembers,
                })}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-canvas-soft rounded-[14px] border border-border flex items-center gap-2.5">
            <Award className="w-4 h-4 text-mute shrink-0" />
            <div>
              <span className="block text-[10px] text-mute uppercase font-semibold">
                {squad.statLabel}
              </span>
              <span className="font-bold text-positive-deep">
                {squad.statValue}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-canvas-soft hover:bg-border/60 text-ink font-semibold rounded-[24px] border border-border transition cursor-pointer text-xs sm:text-sm"
          >
            {t("common.close")}
          </button>
          <button
            type="button"
            onClick={() => onRequestInvite(squad.id)}
            className={`px-6 py-2.5 font-semibold rounded-[24px] text-xs sm:text-sm transition cursor-pointer shadow-sm flex items-center gap-1.5 ${
              isRequested
                ? "bg-primary-pale text-positive-deep border border-primary-neutral"
                : "btn-primary"
            }`}
          >
            {isRequested ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{t("clubs.inviteRequested")}</span>
              </>
            ) : (
              <span>{t("clubs.requestInvite")}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
