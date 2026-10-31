"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { TeamSquad } from "@/types/models";
import { initialSquads } from "@/lib/mockData";
import { useTranslation } from "@/hooks/useTranslation";
import { usePersistentState } from "@/hooks/usePersistentState";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  DEFAULT_SPORT_FILTER,
  buildSportSelectOptions,
} from "@/constants/explore";
import { SquadCard } from "./SquadCard";
import { CreateSquadModal } from "./CreateSquadModal";
import { SquadDetailModal } from "./SquadDetailModal";

export const SquadsSection: React.FC = () => {
  const { t } = useTranslation();

  const [squads, setSquads] = usePersistentState<TeamSquad[]>(
    "teamup_squads",
    initialSquads
  );
  const [requestedSquads, setRequestedSquads] = usePersistentState<number[]>(
    "teamup_requested_squads",
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState(DEFAULT_SPORT_FILTER);
  const [isCreateSquadOpen, setIsCreateSquadOpen] = useState(false);
  const [selectedSquadForDetail, setSelectedSquadForDetail] =
    useState<TeamSquad | null>(null);

  const sportOptions = useMemo(() => buildSportSelectOptions(t), [t]);

  const filteredSquads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return squads.filter((sq) => {
      const matchesSearch =
        q === "" ||
        sq.name.toLowerCase().includes(q) ||
        sq.sport.toLowerCase().includes(q) ||
        sq.venue.toLowerCase().includes(q) ||
        sq.description.toLowerCase().includes(q);

      const matchesSport =
        selectedSport === DEFAULT_SPORT_FILTER ||
        sq.sport.toLowerCase().includes(selectedSport.toLowerCase());

      return matchesSearch && matchesSport;
    });
  }, [squads, searchQuery, selectedSport]);

  const handleRequestInvite = (squadId: number) => {
    setRequestedSquads((prev) =>
      prev.includes(squadId)
        ? prev.filter((id) => id !== squadId)
        : [...prev, squadId]
    );
  };

  const handleSquadCreated = (newSquad: TeamSquad) => {
    setSquads((prev) => [newSquad, ...prev]);
    setRequestedSquads((prev) => [...prev, newSquad.id]);
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
          type="button"
          onClick={() => setIsCreateSquadOpen(true)}
          className="px-6 py-2.5 bg-ink hover:bg-ink/80 text-canvas font-semibold rounded-[24px] text-sm transition flex items-center space-x-2 cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{t("clubs.createSquad")}</span>
        </button>
      </div>

      {/* Squads Search & Sport Filter Bar */}
      <div className="bg-canvas p-4 rounded-[20px] border border-border shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-mute absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={t("clubs.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-canvas-soft border border-border rounded-[14px] text-xs text-ink placeholder:text-mute focus:border-ink focus:outline-none"
          />
        </div>
        <div className="w-full sm:w-56">
          <CustomSelect
            options={sportOptions}
            value={selectedSport}
            onChange={setSelectedSport}
            triggerClassName="py-2.5 px-3.5 text-xs bg-canvas-soft rounded-[14px]"
          />
        </div>
      </div>

      {filteredSquads.length === 0 ? (
        <div className="bg-canvas p-12 text-center rounded-[24px] border border-border shadow-sm">
          <h4 className="font-[900] text-lg text-ink">
            {t("clubs.noSquadsFound")}
          </h4>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedSport(DEFAULT_SPORT_FILTER);
            }}
            className="mt-4 px-6 py-2.5 btn-primary font-semibold rounded-[24px] text-xs shadow-xs cursor-pointer"
          >
            {t("explore.resetFilters")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSquads.map((squad) => (
            <SquadCard
              key={squad.id}
              squad={squad}
              isRequested={requestedSquads.includes(squad.id)}
              onRequestInvite={handleRequestInvite}
              onSelectSquad={setSelectedSquadForDetail}
            />
          ))}
        </div>
      )}

      {/* Dedicated Create Squad Modal */}
      <CreateSquadModal
        isOpen={isCreateSquadOpen}
        onClose={() => setIsCreateSquadOpen(false)}
        onSquadCreated={handleSquadCreated}
      />

      {/* Dedicated Squad Detail Modal */}
      <SquadDetailModal
        squad={selectedSquadForDetail}
        isRequested={
          selectedSquadForDetail
            ? requestedSquads.includes(selectedSquadForDetail.id)
            : false
        }
        onClose={() => setSelectedSquadForDetail(null)}
        onRequestInvite={handleRequestInvite}
      />
    </section>
  );
};
