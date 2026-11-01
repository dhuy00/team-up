"use client";

import React, { useState, useMemo, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { TeamSquad } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";
import { useSquads } from "@/hooks/useSquads";
import { filterSquadsList } from "@/services/squads";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  DEFAULT_SPORT_FILTER,
  buildSportSelectOptions,
} from "@/constants/explore";
import { SquadCard } from "./SquadCard";
import { CreateSquadModal } from "./CreateSquadModal";
import { SquadDetailModal } from "./SquadDetailModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface SquadsSectionProps {
  initialSquadId?: number | null;
}

export const SquadsSection: React.FC<SquadsSectionProps> = ({
  initialSquadId,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    squads,
    requestedSquads,
    requestInvite,
    createSquad,
    updateSquad,
    deleteSquad,
  } = useSquads();

  const urlSport = searchParams?.get("sport") || DEFAULT_SPORT_FILTER;
  const urlQuery = searchParams?.get("q") || "";
  const urlSquadId = searchParams?.get("squadId")
    ? Number(searchParams.get("squadId"))
    : initialSquadId ?? null;

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [selectedSport, setSelectedSport] = useState(urlSport);
  const [isCreateSquadOpen, setIsCreateSquadOpen] = useState(false);
  const [selectedSquadId, setSelectedSquadId] = useState<number | null>(
    urlSquadId
  );
  const [editingSquad, setEditingSquad] = useState<TeamSquad | null>(null);
  const [squadIdPendingDelete, setSquadIdPendingDelete] = useState<
    number | null
  >(null);

  const syncUrlParams = useCallback(
    (updates: {
      sport?: string;
      q?: string;
      squadId?: number | null;
    }) => {
      if (!pathname?.startsWith("/squads")) return;
      const params = new URLSearchParams(searchParams?.toString() || "");

      const nextSport = updates.sport ?? selectedSport;
      if (nextSport && nextSport !== DEFAULT_SPORT_FILTER) {
        params.set("sport", nextSport);
      } else {
        params.delete("sport");
      }

      const nextQ = updates.q !== undefined ? updates.q : searchQuery;
      if (nextQ.trim()) {
        params.set("q", nextQ.trim());
      } else {
        params.delete("q");
      }

      const nextSquadId =
        updates.squadId !== undefined ? updates.squadId : selectedSquadId;
      if (nextSquadId) {
        params.set("squadId", String(nextSquadId));
      } else {
        params.delete("squadId");
      }

      const queryString = params.toString();
      router.replace(queryString ? `/squads?${queryString}` : "/squads", {
        scroll: false,
      });
    },
    [pathname, router, searchParams, searchQuery, selectedSport, selectedSquadId]
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    syncUrlParams({ q: value });
  };

  const handleSportChange = (sport: string) => {
    setSelectedSport(sport);
    syncUrlParams({ sport });
  };

  const handleSelectSquad = (squad: TeamSquad | null) => {
    const id = squad?.id ?? null;
    setSelectedSquadId(id);
    syncUrlParams({ squadId: id });
  };

  const selectedSquadForDetail = useMemo(
    () => squads.find((sq) => sq.id === selectedSquadId) ?? null,
    [squads, selectedSquadId]
  );

  const squadPendingDelete = useMemo(
    () => squads.find((sq) => sq.id === squadIdPendingDelete) ?? null,
    [squads, squadIdPendingDelete]
  );

  const sportOptions = useMemo(() => buildSportSelectOptions(t), [t]);

  const filteredSquads = useMemo(
    () =>
      filterSquadsList(squads, {
        searchQuery,
        sport: selectedSport,
      }),
    [squads, searchQuery, selectedSport]
  );

  const handleConfirmDeleteSquad = () => {
    if (squadIdPendingDelete !== null) {
      deleteSquad(squadIdPendingDelete);
      if (selectedSquadId === squadIdPendingDelete) {
        handleSelectSquad(null);
      }
      setSquadIdPendingDelete(null);
    }
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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-canvas-soft border border-border rounded-[14px] text-xs sm:text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
          />
        </div>
        <div className="w-full sm:w-56">
          <CustomSelect
            options={sportOptions}
            value={selectedSport}
            onChange={handleSportChange}
            triggerClassName="h-11 py-0 px-3.5 text-xs bg-canvas-soft rounded-[14px]"
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
              syncUrlParams({ q: "", sport: DEFAULT_SPORT_FILTER });
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
              onRequestInvite={requestInvite}
              onSelectSquad={handleSelectSquad}
              onEditSquad={(sq) => setEditingSquad(sq)}
              onDeleteSquad={(id) => setSquadIdPendingDelete(id)}
            />
          ))}
        </div>
      )}

      {/* Dedicated Create Squad Modal */}
      <CreateSquadModal
        isOpen={isCreateSquadOpen}
        onClose={() => setIsCreateSquadOpen(false)}
        onSquadCreated={createSquad}
      />

      {/* Edit Squad Modal */}
      <CreateSquadModal
        isOpen={Boolean(editingSquad)}
        onClose={() => setEditingSquad(null)}
        editingSquad={editingSquad}
        onSquadUpdated={updateSquad}
      />

      {/* Dedicated Squad Detail Modal */}
      <SquadDetailModal
        squad={selectedSquadForDetail}
        isRequested={
          selectedSquadForDetail
            ? requestedSquads.includes(selectedSquadForDetail.id)
            : false
        }
        onClose={() => handleSelectSquad(null)}
        onRequestInvite={requestInvite}
        onEditSquad={(sq) => {
          handleSelectSquad(null);
          setEditingSquad(sq);
        }}
      />

      {/* Delete Squad Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(squadPendingDelete)}
        title={t("clubs.deleteSquadConfirmTitle")}
        message={t("clubs.deleteSquadConfirmMessage", {
          name: squadPendingDelete?.name || "",
        })}
        confirmLabel={t("clubs.deleteSquad")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleConfirmDeleteSquad}
        onCancel={() => setSquadIdPendingDelete(null)}
      />
    </section>
  );
};
