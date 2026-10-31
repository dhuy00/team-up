"use client";

import React from "react";
import { Check } from "lucide-react";
import { TeamSquad } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";

interface SquadCardProps {
  squad: TeamSquad;
  isRequested: boolean;
  onRequestInvite: (squadId: number) => void;
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
  leaderLabel: string;
  venueLabel: string;
  buttonActive: string;
  buttonDefault: string;
  activeLabel: string;
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
    title: "text-2xl font-[900] text-primary tracking-tight",
    description: "text-xs text-canvas-soft/80 mt-2 leading-relaxed",
    statsContainer:
      "space-y-2 text-xs bg-black/30 p-3.5 rounded-[12px] border border-white/10",
    statStrong: "text-canvas",
    statHighlight: "font-bold text-primary",
    leaderLabel: "Captain:",
    venueLabel: "Home Pitch:",
    buttonActive: "bg-white text-ink",
    buttonDefault: "btn-primary",
    activeLabel: "Request Sent",
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
    title: "text-xl font-[900] text-ink tracking-tight",
    description: "text-xs text-body mt-2 leading-relaxed",
    statsContainer:
      "space-y-2 text-xs bg-canvas/70 p-3.5 rounded-[12px] border border-border",
    statStrong: "text-ink",
    statHighlight: "font-bold text-ink",
    leaderLabel: "Host:",
    venueLabel: "Meetup:",
    buttonActive: "bg-positive text-canvas",
    buttonDefault: "bg-ink hover:bg-ink/80 text-canvas",
    activeLabel: "Membership Requested",
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
    title: "text-xl font-[900] text-ink tracking-tight",
    description: "text-xs text-body mt-2 leading-relaxed",
    statsContainer: "space-y-2 text-xs bg-canvas-soft p-3.5 rounded-[12px]",
    statStrong: "text-ink",
    statHighlight: "font-bold text-ink",
    leaderLabel: "Captain:",
    venueLabel: "Venue:",
    buttonActive:
      "bg-primary-pale text-positive-deep border border-primary-neutral",
    buttonDefault:
      "bg-canvas-soft hover:bg-canvas text-ink border border-border",
    activeLabel: "Request Sent",
    defaultLabelKey: "clubs.requestInvite",
  },
};

export const SquadCard: React.FC<SquadCardProps> = ({
  squad,
  isRequested,
  onRequestInvite,
}) => {
  const { t } = useTranslation();
  const styles = SQUAD_VARIANT_STYLES[squad.variant];

  const topBadgeText =
    squad.variant === "dark"
      ? squad.featuredBadge || "Featured Squad"
      : squad.sport;

  const memberCountText =
    squad.variant === "green"
      ? `${squad.memberCount} Members`
      : `${squad.memberCount} / ${squad.maxMembers} Players`;

  return (
    <div className={styles.cardContainer}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className={styles.topBadge}>{topBadgeText}</span>
          <span className={styles.memberCounter}>{memberCountText}</span>
        </div>

        <div className={styles.avatarBox}>{squad.abbr}</div>

        <h3 className={styles.title}>{squad.name}</h3>
        <p className={styles.description}>{squad.description}</p>
      </div>

      <div className={styles.statsContainer}>
        <div className="flex justify-between">
          <span className="text-mute">{styles.leaderLabel}</span>
          <strong className={styles.statStrong}>{squad.captain}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-mute">{styles.venueLabel}</span>
          <span>{squad.venue}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-mute">{squad.statLabel}:</span>
          <span className={styles.statHighlight}>{squad.statValue}</span>
        </div>
      </div>

      <button
        onClick={() => onRequestInvite(squad.id)}
        className={`w-full py-3 font-semibold rounded-[24px] text-xs transition cursor-pointer shadow-sm flex items-center justify-center space-x-1.5 ${
          isRequested ? styles.buttonActive : styles.buttonDefault
        }`}
      >
        {isRequested ? (
          <>
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>{styles.activeLabel}</span>
          </>
        ) : (
          <span>{t(styles.defaultLabelKey)}</span>
        )}
      </button>
    </div>
  );
};
