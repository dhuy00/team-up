"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { initialSquads } from "@/lib/mockData";
import { useTranslation } from "@/hooks/useTranslation";
import { SquadCard } from "./SquadCard";

interface SquadsSectionProps {
  onOpenCreateSquad?: () => void;
}

export const SquadsSection: React.FC<SquadsSectionProps> = ({
  onOpenCreateSquad,
}) => {
  const { t } = useTranslation();
  const [requestedSquads, setRequestedSquads] = useState<number[]>([]);

  const handleRequestInvite = (squadId: number) => {
    setRequestedSquads((prev) =>
      prev.includes(squadId)
        ? prev.filter((id) => id !== squadId)
        : [...prev, squadId]
    );
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-[900] text-ink tracking-tight">
            {t("clubs.title")}
          </h2>
          <p className="text-sm text-body mt-1">{t("clubs.subtitle")}</p>
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
        {initialSquads.map((squad) => (
          <SquadCard
            key={squad.id}
            squad={squad}
            isRequested={requestedSquads.includes(squad.id)}
            onRequestInvite={handleRequestInvite}
          />
        ))}
      </div>
    </section>
  );
};
