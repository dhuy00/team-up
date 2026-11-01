"use client";

import React from "react";
import { Check, Trash2, Pencil } from "lucide-react";
import { TeamSquad } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";
import { getSportIcon } from "@/constants/explore";

interface SquadCardProps {
  squad: TeamSquad;
  isRequested: boolean;
  onRequestInvite: (squadId: number) => void;
  onSelectSquad?: (squad: TeamSquad) => void;
  onEditSquad?: (squad: TeamSquad) => void;
  onDeleteSquad?: (squadId: number) => void;
}

export const SquadCard: React.FC<SquadCardProps> = ({
  squad,
  isRequested,
  onRequestInvite,
  onSelectSquad,
  onEditSquad,
  onDeleteSquad,
}) => {
  const { t } = useTranslation();
  const isCaptain = squad.captain.includes("(You)");
  const sportIcon = getSportIcon(squad.sport);

  const memberCountText = t("clubs.membersCount", {
    current: squad.memberCount,
    max: squad.maxMembers,
  });

  return (
    <div className="bg-canvas rounded-[24px] border border-border hover:border-ink p-6 flex flex-col justify-between space-y-4 shadow-sm transition">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="bg-canvas-soft text-ink text-xs font-semibold px-3 py-1 rounded-full border border-border inline-flex items-center gap-1.5">
            <span>{sportIcon}</span>
            <span>{squad.sport}</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-mute font-semibold">
              {memberCountText}
            </span>
            {isCaptain && onDeleteSquad && (
              <button
                type="button"
                onClick={() => onDeleteSquad(squad.id)}
                aria-label={t("clubs.deleteSquad")}
                title={t("clubs.deleteSquad")}
                className="p-1.5 rounded-full text-mute hover:text-negative hover:bg-negative/10 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4 stroke-[2.2]" />
              </button>
            )}
          </div>
        </div>

        <div className="w-12 h-12 rounded-[12px] bg-canvas-soft text-ink font-[900] text-xl flex items-center justify-center mb-3 border border-border">
          {squad.abbr}
        </div>

        <button
          type="button"
          onClick={() => onSelectSquad?.(squad)}
          className="text-xl font-[900] text-ink tracking-tight hover:underline cursor-pointer text-left"
        >
          {squad.name}
        </button>
        <p className="text-xs text-body mt-2 leading-relaxed">
          {squad.description}
        </p>
      </div>

      <div className="space-y-2 text-xs bg-canvas-soft p-3.5 rounded-[12px] border border-border/60">
        <div className="flex justify-between">
          <span className="text-mute">{t("clubs.captainLabel")}:</span>
          <strong className="text-ink">{squad.captain}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-mute">{t("clubs.homeVenueLabel")}:</span>
          <span className="text-ink">{squad.venue}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-mute">{squad.statLabel}:</span>
          <span className="font-bold text-ink">{squad.statValue}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onSelectSquad?.(squad)}
          className="w-full py-3 font-semibold rounded-[24px] text-xs transition cursor-pointer bg-canvas text-ink border border-border hover:bg-canvas-soft flex items-center justify-center"
        >
          {t("common.details")}
        </button>
        {isCaptain && onEditSquad ? (
          <button
            type="button"
            onClick={() => onEditSquad(squad)}
            className="w-full py-3 font-semibold rounded-[24px] text-xs transition cursor-pointer btn-primary shadow-sm flex items-center justify-center space-x-1.5"
          >
            <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t("clubs.editSquad")}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onRequestInvite(squad.id)}
            className={`w-full py-3 font-semibold rounded-[24px] text-xs transition cursor-pointer shadow-sm flex items-center justify-center space-x-1.5 ${
              isRequested
                ? "bg-primary-pale text-positive-deep border border-primary-neutral"
                : "btn-primary"
            }`}
          >
            {isRequested ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{t("clubs.inviteRequested")}</span>
              </>
            ) : (
              <span>{t("clubs.requestInvite")}</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
