"use client";

import React, { useState } from "react";
import { Plus, Users, Shield, Check } from "lucide-react";
import { TeamSquad } from "@/types/models";
import { initialSquads } from "@/lib/mockData";
import { useTranslation } from "@/hooks/useTranslation";

interface SquadsSectionProps {
  onOpenCreateSquad?: () => void;
}

export const SquadsSection: React.FC<SquadsSectionProps> = ({
  onOpenCreateSquad,
}) => {
  const { t } = useTranslation();
  const [squads, setSquads] = useState<TeamSquad[]>(initialSquads);
  const [requestedSquads, setRequestedSquads] = useState<number[]>([]);

  const handleRequestInvite = (squadId: number) => {
    if (requestedSquads.includes(squadId)) {
      setRequestedSquads(requestedSquads.filter((id) => id !== squadId));
    } else {
      setRequestedSquads([...requestedSquads, squadId]);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-[900] text-ink tracking-tight">
            {t("clubs.title")}
          </h2>
          <p className="text-sm text-body mt-1">
            {t("clubs.subtitle")}
          </p>
        </div>
        <button
          onClick={onOpenCreateSquad}
          className="px-6 py-2.5 bg-ink hover:bg-ink/80 text-canvas font-semibold rounded-[24px] text-sm transition flex items-center space-x-2 cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{t("clubs.createSquad")}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {squads.map((squad) => {
          const isRequested = requestedSquads.includes(squad.id);

          if (squad.variant === "dark") {
            return (
              <div
                key={squad.id}
                className="bg-ink text-canvas rounded-[24px] p-6 flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-primary text-ink text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {squad.featuredBadge || "Featured Squad"}
                    </span>
                    <span className="text-xs font-mono text-primary font-semibold">
                      {squad.memberCount} / {squad.maxMembers} Players
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-[12px] bg-canvas text-ink font-[900] text-xl flex items-center justify-center mb-3">
                    {squad.abbr}
                  </div>
                  <h3 className="text-2xl font-[900] text-primary tracking-tight">
                    {squad.name}
                  </h3>
                  <p className="text-xs text-canvas-soft/80 mt-2 leading-relaxed">
                    {squad.description}
                  </p>
                </div>

                <div className="space-y-2 text-xs bg-black/30 p-3.5 rounded-[12px] border border-white/10">
                  <div className="flex justify-between">
                    <span className="text-mute">Captain:</span>
                    <strong className="text-canvas">{squad.captain}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mute">Home Pitch:</span>
                    <span>{squad.venue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mute">{squad.statLabel}:</span>
                    <span className="font-bold text-primary">{squad.statValue}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRequestInvite(squad.id)}
                  className={`w-full py-3 font-semibold rounded-[24px] text-xs transition cursor-pointer shadow-sm flex items-center justify-center space-x-1.5 ${
                    isRequested
                      ? "bg-white text-ink"
                      : "btn-primary"
                  }`}
                >
                  {isRequested ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Request Sent</span>
                    </>
                  ) : (
                    <span>{t("clubs.requestInvite")}</span>
                  )}
                </button>
              </div>
            );
          }

          if (squad.variant === "green") {
            return (
              <div
                key={squad.id}
                className="bg-primary-pale rounded-[24px] border border-primary-neutral p-6 flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-canvas text-ink text-xs font-semibold px-3 py-1 rounded-full border border-border">
                      {squad.sport}
                    </span>
                    <span className="text-xs font-mono text-positive-deep font-semibold">
                      {squad.memberCount} Members
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-[12px] bg-canvas text-ink font-[900] text-xl flex items-center justify-center mb-3 border border-border">
                    {squad.abbr}
                  </div>
                  <h3 className="text-xl font-[900] text-ink tracking-tight">
                    {squad.name}
                  </h3>
                  <p className="text-xs text-body mt-2 leading-relaxed">
                    {squad.description}
                  </p>
                </div>

                <div className="space-y-2 text-xs bg-canvas/70 p-3.5 rounded-[12px] border border-border">
                  <div className="flex justify-between">
                    <span className="text-mute">Host:</span>
                    <strong className="text-ink">{squad.captain}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mute">Meetup:</span>
                    <span>{squad.venue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mute">{squad.statLabel}:</span>
                    <span className="font-bold text-ink">{squad.statValue}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRequestInvite(squad.id)}
                  className={`w-full py-3 font-semibold rounded-[24px] text-xs transition cursor-pointer shadow-sm flex items-center justify-center space-x-1.5 ${
                    isRequested
                      ? "bg-positive text-canvas"
                      : "bg-ink hover:bg-ink/80 text-canvas"
                  }`}
                >
                  {isRequested ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Membership Requested</span>
                    </>
                  ) : (
                    <span>{t("clubs.instantJoin")}</span>
                  )}
                </button>
              </div>
            );
          }

          // Default white card
          return (
            <div
              key={squad.id}
              className="bg-canvas rounded-[24px] border border-border p-6 flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-canvas-soft text-ink text-xs font-semibold px-3 py-1 rounded-full border border-border">
                    {squad.sport}
                  </span>
                  <span className="text-xs font-mono text-mute font-semibold">
                    {squad.memberCount} / {squad.maxMembers} Players
                  </span>
                </div>
                <div className="w-12 h-12 rounded-[12px] bg-canvas-soft text-ink font-[900] text-xl flex items-center justify-center mb-3 border border-border">
                  {squad.abbr}
                </div>
                <h3 className="text-xl font-[900] text-ink tracking-tight">
                  {squad.name}
                </h3>
                <p className="text-xs text-body mt-2 leading-relaxed">
                  {squad.description}
                </p>
              </div>

              <div className="space-y-2 text-xs bg-canvas-soft p-3.5 rounded-[12px]">
                <div className="flex justify-between">
                  <span className="text-mute">Captain:</span>
                  <strong className="text-ink">{squad.captain}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-mute">Venue:</span>
                  <span>{squad.venue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mute">{squad.statLabel}:</span>
                  <span className="font-bold text-ink">{squad.statValue}</span>
                </div>
              </div>

              <button
                onClick={() => handleRequestInvite(squad.id)}
                className={`w-full py-3 font-semibold rounded-[24px] text-xs transition cursor-pointer shadow-sm flex items-center justify-center space-x-1.5 ${
                  isRequested
                    ? "bg-primary-pale text-positive-deep border border-primary-neutral"
                    : "bg-canvas-soft hover:bg-canvas text-ink border border-border"
                }`}
              >
                {isRequested ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Request Sent</span>
                  </>
                ) : (
                  <span>{t("clubs.requestInvite")}</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
