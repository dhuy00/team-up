"use client";

import React from "react";
import { Check } from "lucide-react";
import { TeamSquad } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";

interface SquadCardProps {
  squad: TeamSquad;
  isRequested: boolean;
  onRequestInvite: (squadId: number) => void;
  onSelectSquad?: (squad: TeamSquad) => void;
}

interface VariantStyleConfig {
  cardContainer: string;
  topBadge: string;
  memberCounter: string;
  avatarBox: string;
  title: string;
  description: string;
  statsContainer: string;
  statStrong: string;
  statHighlight: string;
  buttonActive: string;
  buttonDefault: string;
  defaultLabelKey: "clubs.requestInvite" | "clubs.instantJoin";
}

const SQUAD_VARIANT_STYLES: Record<TeamSquad["variant"], VariantStyleConfig> = {
  dark: {
    cardContainer:
      "bg-ink text-canvas rounded-[24px] p-6 flex flex-col justify-between space-y-4 shadow-sm",
    topBadge:
      "bg-primary text-ink text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider",
    memberCounter: "text-xs font-mono text-primary font-semibold",
    avatarBox:
      "w-12 h-12 rounded-[12px] bg-canvas text-ink font-[900] text-xl flex items-center justify-center mb-3",
    title:
      "text-2xl font-[900] text-primary tracking-tight hover:underline cursor-pointer text-left",
    description: "text-xs text-canvas-soft/80 mt-2 leading-relaxed",
    statsContainer:
      "space-y-2 text-xs bg-black/30 p-3.5 rounded-[12px] border border-white/10",
    statStrong: "text-canvas",
    statHighlight: "font-bold text-primary",
    buttonActive: "bg-white text-ink",
    buttonDefault: "btn-primary",
    defaultLabelKey: "clubs.requestInvite",
  },
  green: {
    cardContainer:
      "bg-primary-pale rounded-[24px] border border-primary-neutral p-6 flex flex-col justify-between space-y-4 shadow-sm",
    topBadge:
      "bg-canvas text-ink text-xs font-semibold px-3 py-1 rounded-full border border-border",
    memberCounter: "text-xs font-mono text-positive-deep font-semibold",
    avatarBox:
      "w-12 h-12 rounded-[12px] bg-canvas text-ink font-[900] text-xl flex items-center justify-center mb-3 border border-border",
    title:
      "text-xl font-[900] text-ink tracking-tight hover:underline cursor-pointer text-left",
    description: "text-xs text-body mt-2 leading-relaxed",
    statsContainer:
      "space-y-2 text-xs bg-canvas/70 p-3.5 rounded-[12px] border border-border",
    statStrong: "text-ink",
    statHighlight: "font-bold text-ink",
    buttonActive: "bg-positive text-canvas",
    buttonDefault: "bg-ink hover:bg-ink/80 text-canvas",
    defaultLabelKey: "clubs.instantJoin",
  },
  white: {
    cardContainer:
      "bg-canvas rounded-[24px] border border-border p-6 flex flex-col justify-between space-y-4 shadow-sm",
    topBadge:
      "bg-canvas-soft text-ink text-xs font-semibold px-3 py-1 rounded-full border border-border",
    memberCounter: "text-xs font-mono text-mute font-semibold",
    avatarBox:
      "w-12 h-12 rounded-[12px] bg-canvas-soft text-ink font-[900] text-xl flex items-center justify-center mb-3 border border-border",
    title:
      "text-xl font-[900] text-ink tracking-tight hover:underline cursor-pointer text-left",
    description: "text-xs text-body mt-2 leading-relaxed",
    statsContainer: "space-y-2 text-xs bg-canvas-soft p-3.5 rounded-[12px]",
    statStrong: "text-ink",
    statHighlight: "font-bold text-ink",
    buttonActive:
      "bg-primary-pale text-positive-deep border border-primary-neutral",
    buttonDefault:
      "bg-canvas-soft hover:bg-canvas text-ink border border-border",
    defaultLabelKey: "clubs.requestInvite",
  },
};

export const SquadCard: React.FC<SquadCardProps> = ({
  squad,
  isRequested,
  onRequestInvite,
  onSelectSquad,
}) => {
  const { t } = useTranslation();
  const styles = SQUAD_VARIANT_STYLES[squad.variant];

  const topBadgeText =
    squad.variant === "dark"
      ? squad.featuredBadge || squad.sport
      : squad.sport;

  const memberCountText = t("clubs.membersCount", {
    current: squad.memberCount,
    max: squad.maxMembers,
  });

  return (
    <div className={styles.cardContainer}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className={styles.topBadge}>{topBadgeText}</span>
          <span className={styles.memberCounter}>{memberCountText}</span>
        </div>

        <div className={styles.avatarBox}>{squad.abbr}</div>

        <button
          type="button"
          onClick={() => onSelectSquad?.(squad)}
          className={styles.title}
        >
          {squad.name}
        </button>
        <p className={styles.description}>{squad.description}</p>
      </div>

      <div className={styles.statsContainer}>
        <div className="flex justify-between">
          <span className="text-mute">{t("clubs.captainLabel")}:</span>
          <strong className={styles.statStrong}>{squad.captain}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-mute">{t("clubs.homeVenueLabel")}:</span>
          <span>{squad.venue}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-mute">{squad.statLabel}:</span>
          <span className={styles.statHighlight}>{squad.statValue}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelectSquad?.(squad)}
          className="px-4 py-3 font-semibold rounded-[24px] text-xs transition cursor-pointer bg-canvas text-ink border border-border hover:bg-canvas-soft shrink-0"
        >
          {t("common.details")}
        </button>
        <button
          type="button"
          onClick={() => onRequestInvite(squad.id)}
          className={`flex-1 py-3 font-semibold rounded-[24px] text-xs transition cursor-pointer shadow-sm flex items-center justify-center space-x-1.5 ${
            isRequested ? styles.buttonActive : styles.buttonDefault
          }`}
        >
          {isRequested ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{t("clubs.inviteRequested")}</span>
            </>
          ) : (
            <span>{t(styles.defaultLabelKey)}</span>
          )}
        </button>
      </div>
    </div>
  );
};
