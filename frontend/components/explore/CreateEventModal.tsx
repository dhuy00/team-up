"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Check } from "lucide-react";
import { EventActivity } from "@/types/models";
import { initialEvents } from "@/lib/mockData";
import { useTranslation } from "@/hooks/useTranslation";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useToast } from "@/context/ToastContext";
import { findConflictingJoinedEvent } from "@/lib/scheduleConflict";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { CustomDateTimePicker } from "@/components/ui/CustomDateTimePicker";
import {
  EVENT_CAPACITY_CONFIG,
  getSportIcon,
  buildSportSelectOptions,
  buildSkillSelectOptions,
} from "@/constants/explore";
import { DEFAULT_RADAR_CENTER } from "@/constants/radar";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: EventActivity) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
}) => {
  const { t, locale } = useTranslation();
  const toast = useToast();
  const [existingEvents] = usePersistentState<EventActivity[]>(
    "teamup_events",
    initialEvents
  );

  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("Soccer");
  const [skill, setSkill] = useState("All Levels");
  const [dateTime, setDateTime] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const d = String(tomorrow.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}T19:00`;
  });
  const [capacity, setCapacity] = useState<string>(
    String(EVENT_CAPACITY_CONFIG.DEFAULT)
  );
  const [capacityError, setCapacityError] = useState(false);
  const [venue, setVenue] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [feeAmount, setFeeAmount] = useState<string>("");
  const [costError, setCostError] = useState(false);
  const [notes, setNotes] = useState("");

  const sportOptions = useMemo(
    () => buildSportSelectOptions(t, { includeAll: false }),
    [t]
  );
  const skillOptions = useMemo(() => buildSkillSelectOptions(t), [t]);

  const currencySymbol = locale === "vi" ? "VND" : "$";

  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCapacityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E", "."].includes(e.key)) {
      e.preventDefault();
      return;
    }
    // Block typing 0 as the first character
    const isAtStart =
      e.currentTarget.selectionStart === 0 &&
      e.currentTarget.selectionEnd === 0;
    if (e.key === "0" && (capacity === "" || isAtStart)) {
      e.preventDefault();
    }
  };

  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setCapacity("");
      setCapacityError(false);
      return;
    }

    // Strip non-digits and any leading zeros (e.g. "001" -> "1", "010" -> "10")
    const sanitized = raw.replace(/\D/g, "").replace(/^0+/, "");
    if (sanitized !== raw) {
      e.currentTarget.value = sanitized;
    }

    if (sanitized === "") {
      setCapacity("");
      setCapacityError(true);
      return;
    }

    const numericVal = Number(sanitized);
    if (numericVal > EVENT_CAPACITY_CONFIG.MAX) {
      const clamped = String(EVENT_CAPACITY_CONFIG.MAX);
      e.currentTarget.value = clamped;
      setCapacity(clamped);
      setCapacityError(true);
      return;
    }

    setCapacity(sanitized);
    setCapacityError(numericVal < EVENT_CAPACITY_CONFIG.MIN);
  };

  const handleFeeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E"].includes(e.key)) {
      e.preventDefault();
      return;
    }
    const isAtStart =
      e.currentTarget.selectionStart === 0 &&
      e.currentTarget.selectionEnd === 0;
    if (e.key === "0" && (feeAmount === "" || isAtStart)) {
      e.preventDefault();
      setCostError(true);
    }
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setFeeAmount("");
      setCostError(false);
      return;
    }

    const sanitized = raw.replace(/^0+/, "");
    if (sanitized !== raw) {
      e.currentTarget.value = sanitized;
    }

    if (sanitized === "") {
      setFeeAmount("");
      setCostError(true);
      return;
    }

    const numericVal = Number(sanitized);
    if (Number.isNaN(numericVal) || numericVal <= 0) {
      setCostError(true);
      return;
    }

    setCostError(false);
    setFeeAmount(sanitized);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !venue.trim()) return;

    const numericCapacity = Number(capacity);
    if (
      !capacity ||
      Number.isNaN(numericCapacity) ||
      numericCapacity < EVENT_CAPACITY_CONFIG.MIN ||
      numericCapacity > EVENT_CAPACITY_CONFIG.MAX
    ) {
      setCapacityError(true);
      toast.error(
        t("toast.invalidCapacity", {
          min: EVENT_CAPACITY_CONFIG.MIN,
          max: EVENT_CAPACITY_CONFIG.MAX,
        })
      );
      return;
    }

    let formattedCost = "Free";
    if (!isFree) {
      const numericFee = Number(feeAmount);
      if (!feeAmount || Number.isNaN(numericFee) || numericFee <= 0) {
        setCostError(true);
        toast.error(t("toast.invalidCost"));
        return;
      }
      formattedCost =
        locale === "vi"
          ? `${numericFee.toLocaleString("vi-VN")} VND ${t("createEvent.currencyPerPlayer")}`
          : `$${numericFee} ${t("createEvent.currencyPerPlayer")}`;
    }

    const newActivity: EventActivity = {
      id: Date.now(),
      title: title.trim(),
      sport,
      icon: getSportIcon(sport),
      skill,
      venue: venue.trim(),
      address: venue.trim(),
      distanceKm: 1.0,
      lat: DEFAULT_RADAR_CENTER.lat,
      lng: DEFAULT_RADAR_CENTER.lng,
      dateTimeStr: dateTime
        ? new Date(dateTime).toLocaleString()
        : "This weekend",
      startTimeIso: dateTime || undefined,
      cost: formattedCost,
      confirmedPlayers: 1,
      maxPlayers: numericCapacity,
      host: {
        name: "Alex Morgan (You)",
        karma: 98,
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
      },
      userJoined: true,
      isUserHost: true,
      roster: [{ name: "Alex Morgan (You)", role: "Host / Captain", karma: 98 }],
      notes: notes.trim(),
    };

    const conflictingEvent = findConflictingJoinedEvent(
      newActivity,
      existingEvents
    );
    if (conflictingEvent) {
      toast.error(
        t("toast.scheduleConflict", {
          title: conflictingEvent.title,
          time: conflictingEvent.dateTimeStr,
        })
      );
      return;
    }

    onEventCreated(newActivity);
    toast.success(t("toast.eventCreated"));

    setTitle("");
    setVenue("");
    setCapacity(String(EVENT_CAPACITY_CONFIG.DEFAULT));
    setCapacityError(false);
    setIsFree(true);
    setFeeAmount("");
    setCostError(false);
    setNotes("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-event-title"
    >
      <div className="bg-canvas rounded-[24px] max-w-2xl w-full p-6 sm:p-8 border border-border shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-mute">
              {t("createEvent.badge")}
            </span>
            <h3
              id="create-event-title"
              className="text-2xl font-[900] text-ink tracking-tight"
            >
              {t("createEvent.title")}
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
          <div>
            <label className="block font-semibold text-ink mb-1">
              {t("createEvent.activityTitle")}
            </label>
            <input
              required
              type="text"
              placeholder={t("createEvent.activityTitlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-canvas-soft border border-border rounded-[12px] text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink mb-1">
                {t("createEvent.sportCategory")}
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
                {t("createEvent.skillRequirement")}
              </label>
              <CustomSelect
                options={skillOptions}
                value={skill}
                onChange={(val) => setSkill(val)}
                triggerClassName="py-2.5 px-3 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink mb-1">
                {t("createEvent.dateTime")}
              </label>
              <CustomDateTimePicker
                value={dateTime}
                onChange={setDateTime}
              />
            </div>
            <div>
              <label className="block font-semibold text-ink mb-1">
                {t("createEvent.playerCapacity")}
              </label>
              <input
                required
                type="text"
                inputMode="numeric"
                placeholder={`${EVENT_CAPACITY_CONFIG.MIN} - ${EVENT_CAPACITY_CONFIG.MAX}`}
                value={capacity}
                onKeyDown={handleCapacityKeyDown}
                onChange={handleCapacityChange}
                className={`w-full h-11 px-3.5 bg-canvas-soft border rounded-[12px] text-ink focus:outline-none ${
                  capacityError
                    ? "border-negative focus:border-negative"
                    : "border-border focus:border-ink"
                }`}
              />
              {capacityError && (
                <p className="text-[11px] text-negative font-semibold mt-1">
                  {t("createEvent.capacityInvalidError", {
                    min: EVENT_CAPACITY_CONFIG.MIN,
                    max: EVENT_CAPACITY_CONFIG.MAX,
                  })}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">
              {t("createEvent.venueLabel")}
            </label>
            <input
              required
              type="text"
              placeholder={t("createEvent.venuePlaceholder")}
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-4 py-2.5 bg-canvas-soft border border-border rounded-[12px] text-ink focus:border-ink focus:outline-none"
            />
          </div>

          {/* Cost per Person with Currency Display + Free Checkbox */}
          <div className="p-4 bg-canvas-soft/60 rounded-[16px] border border-border space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-semibold text-ink flex items-center gap-1.5">
                <span>{t("createEvent.costLabel")}</span>
                <span className="px-2 py-0.5 bg-canvas border border-border rounded-full text-[11px] font-mono font-bold text-ink">
                  {currencySymbol}
                </span>
              </label>

              {/* Free Checkbox */}
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => {
                    setIsFree(e.target.checked);
                    if (e.target.checked) {
                      setCostError(false);
                    }
                  }}
                  className="sr-only peer"
                />
                <span
                  className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition ${
                    isFree
                      ? "bg-primary border-ink text-ink"
                      : "bg-canvas border-border"
                  }`}
                >
                  {isFree && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
                <span className="text-xs font-semibold text-ink">
                  {t("createEvent.freeCheckbox")}
                </span>
              </label>
            </div>

            {!isFree ? (
              <div className="space-y-1">
                <div className="relative flex items-center">
                  {locale === "en" && (
                    <span className="absolute left-3.5 text-xs font-bold text-ink font-mono pointer-events-none">
                      $
                    </span>
                  )}
                  <input
                    required={!isFree}
                    type="text"
                    inputMode="decimal"
                    placeholder={t("createEvent.costPlaceholder")}
                    value={feeAmount}
                    onKeyDown={handleFeeKeyDown}
                    onChange={handleFeeChange}
                    className={`w-full py-2.5 bg-canvas border rounded-[12px] text-ink focus:outline-none ${
                      locale === "en" ? "pl-8 pr-24" : "pl-4 pr-28"
                    } ${
                      costError
                        ? "border-negative focus:border-negative"
                        : "border-border focus:border-ink"
                    }`}
                  />
                  <span className="absolute right-3.5 text-xs font-semibold text-mute pointer-events-none">
                    {locale === "vi"
                      ? `VND ${t("createEvent.currencyPerPlayer")}`
                      : t("createEvent.currencyPerPlayer")}
                  </span>
                </div>
                {costError && (
                  <p className="text-[11px] text-negative font-semibold">
                    {t("createEvent.costInvalidError")}
                  </p>
                )}
              </div>
            ) : (
              <div className="px-3.5 py-2 bg-primary-pale/70 border border-primary-neutral rounded-[10px] text-xs font-bold text-positive-deep flex items-center justify-between">
                <span>{t("common.free")}</span>
                <span className="font-mono">
                  0 {currencySymbol} {t("createEvent.currencyPerPlayer")}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">
              {t("createEvent.notesLabel")}
            </label>
            <textarea
              rows={2}
              placeholder={t("createEvent.notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              {t("createEvent.publishActivity")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
