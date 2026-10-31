"use client";

import React, { useState, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { SportPassportItem } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";
import { CustomSelect, CustomSelectOption } from "@/components/ui/CustomSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getSportIcon } from "@/constants/explore";

interface SportSkillMatrixProps {
  sports: SportPassportItem[];
  onAddSport: (sport: SportPassportItem) => void;
  onRemoveSport: (sportId: number) => void;
}

export const SportSkillMatrix: React.FC<SportSkillMatrixProps> = ({
  sports,
  onAddSport,
  onRemoveSport,
}) => {
  const { t } = useTranslation();
  const [isAddingSport, setIsAddingSport] = useState(false);
  const [newSportName, setNewSportName] = useState("");
  const [newSportRole, setNewSportRole] = useState("");
  const [newSportTier, setNewSportTier] = useState("Intermediate");
  const [sportPendingDelete, setSportPendingDelete] =
    useState<SportPassportItem | null>(null);

  const tierOptions: CustomSelectOption[] = useMemo(
    () => [
      { value: "Beginner", label: t("skills.beginner") },
      { value: "Intermediate", label: t("skills.intermediate") },
      { value: "Advanced", label: t("skills.advanced") },
    ],
    [t]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSportName.trim()) return;

    const newSport: SportPassportItem = {
      id: Date.now(),
      name: newSportName.trim(),
      icon: getSportIcon(newSportName.trim()),
      role: newSportRole.trim() || "Player",
      skillTier: newSportTier,
      verifications: t("passport.selfAssessed"),
    };

    onAddSport(newSport);
    setNewSportName("");
    setNewSportRole("");
    setIsAddingSport(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-[900] text-ink tracking-tight">
            {t("passport.sportsPassportTitle")}
          </h3>
          <p className="text-xs text-mute mt-0.5">
            {t("passport.sportsPassportSubtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddingSport(!isAddingSport)}
          className="text-xs text-ink font-semibold underline hover:text-mute cursor-pointer"
        >
          {t("passport.addSport")}
        </button>
      </div>

      {/* Optional Add Sport Form */}
      {isAddingSport && (
        <form
          onSubmit={handleSubmit}
          className="p-4 bg-canvas-soft rounded-[16px] border border-border space-y-3 text-xs"
        >
          <div className="font-bold text-ink">
            {t("passport.addSportFormTitle")}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              required
              placeholder={t("passport.sportNamePlaceholder")}
              value={newSportName}
              onChange={(e) => setNewSportName(e.target.value)}
              className="px-3 py-2 bg-canvas border border-border rounded-[10px] text-ink focus:outline-none"
            />
            <input
              type="text"
              placeholder={t("passport.rolePlaceholder")}
              value={newSportRole}
              onChange={(e) => setNewSportRole(e.target.value)}
              className="px-3 py-2 bg-canvas border border-border rounded-[10px] text-ink focus:outline-none"
            />
            <CustomSelect
              options={tierOptions}
              value={newSportTier}
              onChange={(val) => setNewSportTier(val)}
              triggerClassName="py-2 px-3 text-xs bg-canvas rounded-[10px]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingSport(false)}
              className="px-3 py-1.5 text-body font-semibold hover:text-ink cursor-pointer"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="btn-primary px-4 py-1.5 font-bold rounded-[16px] text-xs shadow-xs cursor-pointer"
            >
              {t("passport.saveSport")}
            </button>
          </div>
        </form>
      )}

      {/* Activity Rows */}
      <div className="space-y-3">
        {sports.map((sport) => (
          <div
            key={sport.id}
            className="p-4 rounded-[16px] bg-canvas-soft border border-border flex items-center justify-between gap-3"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-[12px] bg-canvas text-ink flex items-center justify-center text-xl border border-ink shadow-xs shrink-0">
                {sport.icon}
              </div>
              <div>
                <h4 className="font-bold text-sm text-ink">{sport.name}</h4>
                <p className="text-xs text-mute">{sport.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="px-3 py-1 bg-ink text-canvas text-xs font-bold rounded-full">
                  {sport.skillTier}
                </span>
                <span className="block text-[10px] text-mute mt-1 font-mono">
                  {sport.verifications}
                </span>
              </div>
              {sports.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSportPendingDelete(sport)}
                  aria-label={t("passport.removeSport")}
                  title={t("passport.removeSport")}
                  className="p-1.5 text-mute hover:text-negative rounded-full hover:bg-canvas transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={Boolean(sportPendingDelete)}
        title={t("passport.removeSport")}
        message={t("common.deleteMatchConfirmMessage", {
          title: sportPendingDelete?.name || "",
        })}
        confirmLabel={t("passport.removeSport")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          if (sportPendingDelete) {
            onRemoveSport(sportPendingDelete.id);
            setSportPendingDelete(null);
          }
        }}
        onCancel={() => setSportPendingDelete(null)}
      />
    </div>
  );
};
