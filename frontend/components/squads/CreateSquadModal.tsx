"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { TeamSquad } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { buildSportSelectOptions } from "@/constants/explore";

interface CreateSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSquadCreated: (newSquad: TeamSquad) => void;
}

export const CreateSquadModal: React.FC<CreateSquadModalProps> = ({
  isOpen,
  onClose,
  onSquadCreated,
}) => {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [abbr, setAbbr] = useState("");
  const [sport, setSport] = useState("Soccer");
  const [maxMembers, setMaxMembers] = useState(16);
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");

  const sportOptions = useMemo(
    () => buildSportSelectOptions(t, { includeAll: false }),
    [t]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !venue.trim()) return;

    const derivedAbbr =
      abbr.trim().toUpperCase() ||
      name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 3)
        .toUpperCase();

    const newSquad: TeamSquad = {
      id: Date.now(),
      name: name.trim(),
      sport,
      abbr: derivedAbbr,
      variant: "white",
      memberCount: 1,
      maxMembers: Number(maxMembers) || 16,
      description:
        description.trim() ||
        "Weekly practice and competitive scrimmages. Reliable players welcome!",
      captain: "Alex Morgan (You)",
      venue: venue.trim(),
      statLabel: "Skill",
      statValue: "All Levels",
    };

    onSquadCreated(newSquad);
    setName("");
    setAbbr("");
    setVenue("");
    setDescription("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-squad-title"
    >
      <div className="bg-canvas rounded-[24px] max-w-lg w-full p-6 sm:p-7 border border-border shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-mute">
              {t("clubs.modalBadge")}
            </span>
            <h3
              id="create-squad-title"
              className="text-2xl font-[900] text-ink tracking-tight"
            >
              {t("clubs.modalTitle")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="p-2 text-mute hover:text-ink rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-ink mb-1">
                {t("clubs.squadNameLabel")}
              </label>
              <input
                required
                type="text"
                placeholder={t("clubs.squadNamePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-canvas-soft border border-border rounded-[12px] text-ink focus:border-ink focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink mb-1">
                {t("clubs.abbrLabel")}
              </label>
              <input
                type="text"
                maxLength={3}
                placeholder="MSC"
                value={abbr}
                onChange={(e) => setAbbr(e.target.value)}
                className="w-full px-3 py-2.5 bg-canvas-soft border border-border rounded-[12px] text-ink uppercase focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1">
                {t("clubs.sportLabel")}
              </label>
              <CustomSelect
                options={sportOptions}
                value={sport}
                onChange={(val) => setSport(val)}
                triggerClassName="py-2.5 px-3 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink mb-1">
                {t("clubs.maxMembersLabel")}
              </label>
              <input
                required
                type="number"
                min={2}
                max={50}
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-canvas-soft border border-border rounded-[12px] text-ink focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">
              {t("clubs.venueLabel")}
            </label>
            <input
              required
              type="text"
              placeholder={t("clubs.venuePlaceholder")}
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-4 py-2.5 bg-canvas-soft border border-border rounded-[12px] text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">
              {t("clubs.descriptionLabel")}
            </label>
            <textarea
              rows={3}
              placeholder={t("clubs.descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-canvas-soft border border-border rounded-[12px] text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-body font-semibold hover:text-ink transition cursor-pointer text-sm"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2.5 rounded-[24px] text-sm shadow-sm cursor-pointer"
            >
              {t("clubs.publishSquad")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
