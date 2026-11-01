"use client";

import React, { useState, useMemo, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { EventActivity } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";
import { filterEventsList } from "@/services/events";
import { EventDetailModal } from "./EventDetailModal";
import { CreateEventModal } from "./CreateEventModal";
import { RadarVisualFeed } from "./RadarVisualFeed";
import { ExploreFilterBar } from "./ExploreFilterBar";
import { EventCard } from "./EventCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  DISTANCE_FILTER_CONFIG,
  DEFAULT_SPORT_FILTER,
  DEFAULT_SKILL_FILTER,
} from "@/constants/explore";

interface ExploreSectionProps {
  events: EventActivity[];
  onToggleJoin: (eventId: number) => void;
  onTransferHost?: (eventId: number, newHostName: string) => void;
  onDeleteEvent?: (eventId: number) => void;
  onUpdateEvents?: (events: EventActivity[]) => void;
  onOpenMatchChat?: (event: EventActivity) => void;
  selectedSport: string;
  selectedRadius: number;
  onSportChange: (sport: string) => void;
  onRadiusChange: (distanceKm: number) => void;
}

export const ExploreSection: React.FC<ExploreSectionProps> = ({
  events,
  onToggleJoin,
  onTransferHost,
  onDeleteEvent,
  onUpdateEvents,
  onOpenMatchChat,
  selectedSport,
  selectedRadius,
  onSportChange,
  onRadiusChange,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams?.get("q") || "";
  const urlSkill = searchParams?.get("skill") || DEFAULT_SKILL_FILTER;
  const urlEventId = searchParams?.get("eventId")
    ? Number(searchParams.get("eventId"))
    : null;

  const [searchTerm, setSearchTerm] = useState(urlQuery);
  const [filterSkill, setFilterSkill] = useState(urlSkill);
  const [selectedEventIdForModal, setSelectedEventIdForModal] = useState<
    number | null
  >(urlEventId);
  const [eventIdPendingDelete, setEventIdPendingDelete] = useState<
    number | null
  >(null);
  const [editingEvent, setEditingEvent] = useState<EventActivity | null>(null);

  const syncSectionUrl = useCallback(
    (updates: {
      q?: string;
      skill?: string;
      eventId?: number | null;
      resetAll?: boolean;
    }) => {
      if (pathname && pathname !== "/" && !pathname.startsWith("/explore")) {
        return;
      }
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (updates.resetAll) {
        params.delete("q");
        params.delete("sport");
        params.delete("skill");
        params.delete("radius");
        params.delete("eventId");
      } else {
        const nextQ = updates.q !== undefined ? updates.q : searchTerm;
        if (nextQ.trim()) {
          params.set("q", nextQ.trim());
        } else {
          params.delete("q");
        }

        const nextSkill = updates.skill ?? filterSkill;
        if (nextSkill && nextSkill !== DEFAULT_SKILL_FILTER) {
          params.set("skill", nextSkill);
        } else {
          params.delete("skill");
        }

        const nextEventId =
          updates.eventId !== undefined
            ? updates.eventId
            : selectedEventIdForModal;
        if (nextEventId) {
          params.set("eventId", String(nextEventId));
        } else {
          params.delete("eventId");
        }
      }

      const base = pathname || "/";
      const qs = params.toString();
      router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    },
    [
      filterSkill,
      pathname,
      router,
      searchParams,
      searchTerm,
      selectedEventIdForModal,
    ]
  );

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    syncSectionUrl({ q: value });
  };

  const handleSkillChange = (skill: string) => {
    setFilterSkill(skill);
    syncSectionUrl({ skill });
  };

  const handleSelectEventModal = (eventId: number | null) => {
    setSelectedEventIdForModal(eventId);
    syncSectionUrl({ eventId });
  };

  const filteredEvents = useMemo(
    () =>
      filterEventsList(events, {
        searchQuery: searchTerm,
        sport: selectedSport,
        skill: filterSkill,
        maxRadiusKm: selectedRadius,
      }),
    [events, searchTerm, selectedSport, filterSkill, selectedRadius]
  );

  // Derive the active modal event directly from `events` so join/leave/host updates stay automatically in sync
  const selectedEventForModal = useMemo(
    () => events.find((ev) => ev.id === selectedEventIdForModal) ?? null,
    [events, selectedEventIdForModal]
  );

  const eventPendingDelete = useMemo(
    () => events.find((ev) => ev.id === eventIdPendingDelete) ?? null,
    [events, eventIdPendingDelete]
  );

  const handleConfirmDelete = () => {
    if (eventIdPendingDelete !== null) {
      onDeleteEvent?.(eventIdPendingDelete);
      if (selectedEventIdForModal === eventIdPendingDelete) {
        handleSelectEventModal(null);
      }
      setEventIdPendingDelete(null);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    onSportChange(DEFAULT_SPORT_FILTER);
    setFilterSkill(DEFAULT_SKILL_FILTER);
    onRadiusChange(DISTANCE_FILTER_CONFIG.DEFAULT);
    syncSectionUrl({ resetAll: true });
  };

  return (
    <section id="explore-section" className="space-y-6 scroll-mt-24">
      <ExploreFilterBar
        searchTerm={searchTerm}
        onSearchTermChange={handleSearchTermChange}
        selectedSport={selectedSport}
        onSportChange={onSportChange}
        filterSkill={filterSkill}
        onSkillChange={handleSkillChange}
        selectedRadius={selectedRadius}
        onRadiusChange={onRadiusChange}
        matchesCount={filteredEvents.length}
        onResetFilters={handleResetFilters}
      />

      {/* Main Content Split: Event Cards Feed + Local Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Event Cards Feed */}
        <div className="lg:col-span-7 space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="bg-canvas p-12 text-center rounded-[24px] border border-border shadow-sm">
              <h4 className="font-[900] text-lg text-ink">
                {t("explore.noActivitiesFound")}
              </h4>
              <p className="text-xs text-body mt-1">
                {t("explore.noActivitiesHint")}
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 px-6 py-2.5 btn-primary font-semibold rounded-[24px] text-xs shadow-xs cursor-pointer"
              >
                {t("explore.resetFilters")}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onSelectDetails={(selected) =>
                    handleSelectEventModal(selected.id)
                  }
                  onToggleJoin={onToggleJoin}
                  onDeleteEvent={(id) => setEventIdPendingDelete(id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Local Game Radar Card */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-canvas p-5 rounded-[24px] border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-ink" />
                {t("explore.localRadar")}
              </span>
              <span className="text-xs text-mute font-mono">
                {t("explore.pinsActive", { count: filteredEvents.length })}
              </span>
            </div>

            <RadarVisualFeed
              events={filteredEvents}
              allEvents={events}
              selectedRadius={selectedRadius}
              onSelectEvent={(selected) => handleSelectEventModal(selected.id)}
              onUpdateEvents={onUpdateEvents}
            />

            <div className="text-[11px] text-mute text-center">
              {t("explore.radarHint")}
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedEventForModal && (
        <EventDetailModal
          event={selectedEventForModal}
          onClose={() => handleSelectEventModal(null)}
          onTransferHost={onTransferHost}
          onOpenMatchChat={
            onOpenMatchChat
              ? (ev) => {
                  handleSelectEventModal(null);
                  onOpenMatchChat(ev);
                }
              : undefined
          }
          onEditEvent={(ev) => {
            handleSelectEventModal(null);
            setEditingEvent(ev);
          }}
        />
      )}

      {/* Edit Match Modal */}
      <CreateEventModal
        isOpen={Boolean(editingEvent)}
        onClose={() => setEditingEvent(null)}
        editingEvent={editingEvent}
        onEventUpdated={(updated) => {
          onUpdateEvents?.(
            events.map((ev) => (ev.id === updated.id ? updated : ev))
          );
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(eventPendingDelete)}
        title={t("common.deleteMatchConfirmTitle")}
        message={t("common.deleteMatchConfirmMessage", {
          title: eventPendingDelete?.title || "",
        })}
        confirmLabel={t("common.deleteMatch")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setEventIdPendingDelete(null)}
      />
    </section>
  );
};
