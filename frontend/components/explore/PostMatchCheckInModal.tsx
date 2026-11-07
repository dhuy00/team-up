"use client";

import React, { useState, useEffect } from "react";
import { X, Check, ShieldCheck, Award } from "lucide-react";
import { AttendanceStatus, EventActivity } from "@/types/models";
import { FAIR_PLAY_BADGE_OPTIONS } from "@/lib/karma";
import { useTranslation } from "@/hooks/useTranslation";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface PostMatchCheckInModalProps {
  event: EventActivity | null;
  onClose: () => void;
  onSubmitCheckIn: (
    eventId: number,
    attendanceMap: Record<string, AttendanceStatus>,
    badgesAwarded: string[],
    endorseSport: boolean
  ) => void;
}

export const PostMatchCheckInModal: React.FC<PostMatchCheckInModalProps> = ({
  event,
  onClose,
  onSubmitCheckIn,
}) => {
  const { t } = useTranslation();
  useLockBodyScroll(Boolean(event));

  const openKey = event ? `checkin-${event.id}` : "closed";
  const [prevOpenKey, setPrevOpenKey] = useState(openKey);
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [selectedBadges, setSelectedBadges] = useState<string[]>([
    FAIR_PLAY_BADGE_OPTIONS[0],
  ]);
  const [endorseSport, setEndorseSport] = useState(true);

  if (openKey !== prevOpenKey) {
    setPrevOpenKey(openKey);
    if (event) {
      const defaults: Record<string, AttendanceStatus> = {};
      for (const player of event.roster) {
        defaults[player.name] = player.attendance || "showed_up";
      }
      setAttendanceMap(defaults);
      setSelectedBadges([FAIR_PLAY_BADGE_OPTIONS[0]]);
      setEndorseSport(true);
    }
  }

  useEffect(() => {
    if (!event) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [event, onClose]);

  if (!event) return null;

  const handleSetAttendance = (playerName: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [playerName]: status,
    }));
  };

  const toggleBadge = (badge: string) => {
    setSelectedBadges((prev) =>
      prev.includes(badge) ? prev.filter((b) => b !== badge) : [...prev, badge]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitCheckIn(event.id, attendanceMap, selectedBadges, endorseSport);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-match-checkin-title"
    >
      <div className="bg-canvas rounded-[24px] max-w-xl w-full p-6 sm:p-7 border border-border shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar transition-colors duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-pale text-positive-deep border border-primary-neutral text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {event.icon} {event.sport}
              </span>
            </span>
            <h3
              id="post-match-checkin-title"
              className="text-xl sm:text-2xl font-[900] text-ink tracking-tight"
            >
              {t("eventDetail.checkInModalTitle")}
            </h3>
            <p className="text-xs text-body mt-1">
              {t("eventDetail.checkInModalSubtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="p-2 bg-canvas-soft hover:bg-border/60 text-mute hover:text-ink rounded-full transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Roster Attendance Section */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-mute mb-2.5">
              {t("eventDetail.confirmedRoster", { count: event.roster.length })}
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {event.roster.map((player) => {
                const status = attendanceMap[player.name] || "showed_up";
                return (
                  <div
                    key={player.name}
                    className="p-3 bg-canvas-soft rounded-[14px] border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-ink text-canvas flex items-center justify-center font-bold text-[10px] shrink-0">
                        {player.name.charAt(0)}
                      </span>
                      <span className="text-xs font-bold text-ink truncate">
                        {player.name}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-positive-deep bg-primary-pale px-1.5 py-0.5 rounded-full border border-primary-neutral shrink-0">
                        {player.karma}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          handleSetAttendance(player.name, "showed_up")
                        }
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                          status === "showed_up"
                            ? "bg-primary text-ink border border-ink shadow-2xs"
                            : "bg-canvas text-body border border-border hover:border-ink/40"
                        }`}
                      >
                        {t("eventDetail.attendanceShowedUp")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetAttendance(player.name, "late")}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                          status === "late"
                            ? "bg-[#fff8d6] text-[#735100] border border-[#735100]"
                            : "bg-canvas text-body border border-border hover:border-ink/40"
                        }`}
                      >
                        {t("eventDetail.attendanceLate")}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSetAttendance(player.name, "no_show")
                        }
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                          status === "no_show"
                            ? "bg-negative text-white border border-negative"
                            : "bg-canvas text-body border border-border hover:border-ink/40"
                        }`}
                      >
                        {t("eventDetail.attendanceNoShow")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fair-Play Badges */}
          <div className="p-4 bg-canvas-soft rounded-[16px] border border-border space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Award className="w-4 h-4 text-positive-deep" />
              <span>{t("eventDetail.awardBadgesTitle")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {FAIR_PLAY_BADGE_OPTIONS.map((badge) => {
                const active = selectedBadges.includes(badge);
                return (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => toggleBadge(badge)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 ${
                      active
                        ? "bg-ink text-primary border border-ink shadow-2xs"
                        : "bg-canvas text-body border border-border hover:border-ink/50"
                    }`}
                  >
                    <span>{badge}</span>
                    {active && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            {/* Captain Skill Verification Checkbox */}
            <label className="pt-2 border-t border-border flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={endorseSport}
                onChange={(e) => setEndorseSport(e.target.checked)}
                className="sr-only"
              />
              <span
                className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition shrink-0 ${
                  endorseSport
                    ? "bg-primary border-ink text-ink"
                    : "bg-canvas border-border"
                }`}
              >
                {endorseSport && <Check className="w-3 h-3 stroke-[3]" />}
              </span>
              <span className="text-xs font-semibold text-ink">
                {t("eventDetail.verifySkillCheck")} ({event.sport})
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-body font-semibold hover:text-ink transition cursor-pointer text-sm"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2.5 rounded-[24px] text-sm font-bold shadow-sm cursor-pointer inline-flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              <span>{t("eventDetail.submitCheckInBtn")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
