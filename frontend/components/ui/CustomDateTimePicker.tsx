"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface CustomDateTimePickerProps {
  value: string;
  onChange: (isoLocalString: string) => void;
  className?: string;
  triggerClassName?: string;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseIsoLocal(value: string): {
  dateKey: string;
  hours24: number;
  minutes: number;
} {
  if (!value || !value.includes("T")) {
    const now = new Date();
    return {
      dateKey: toDateKey(now),
      hours24: 19,
      minutes: 0,
    };
  }
  const [datePart, timePart] = value.split("T");
  const [hStr, mStr] = (timePart || "19:00").split(":");
  const h = Math.min(23, Math.max(0, parseInt(hStr || "19", 10) || 0));
  const m = Math.min(59, Math.max(0, parseInt(mStr || "0", 10) || 0));

  return {
    dateKey: datePart,
    hours24: h,
    minutes: m,
  };
}

function formatTimeKey(hours24: number, minutes: number): string {
  return `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatTimeDisplay(
  hours24: number,
  minutes: number,
  locale: string
): string {
  if (locale === "vi") {
    return `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  const period = hours24 >= 12 ? "PM" : "AM";
  const hour12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

function formatHourNumber(hours24: number, locale: string): string {
  const normalized = ((hours24 % 24) + 24) % 24;
  if (locale === "vi") {
    return String(normalized).padStart(2, "0");
  }
  const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
  return String(hour12).padStart(2, "0");
}

function formatMinuteNumber(minutes: number): string {
  const normalized = ((minutes % 60) + 60) % 60;
  return String(normalized).padStart(2, "0");
}

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  value,
  onChange,
  className = "",
  triggerClassName = "",
}) => {
  const { t, locale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourWheelRef = useRef<HTMLDivElement>(null);
  const minuteWheelRef = useRef<HTMLDivElement>(null);
  const meridiemWheelRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => parseIsoLocal(value), [value]);
  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const [y, m] = parsed.dateKey.split("-").map(Number);
    return new Date(y || new Date().getFullYear(), (m || 1) - 1, 1);
  });

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const updateDateTime = useCallback(
    (nextDateKey: string, nextHours24: number, nextMinutes: number) => {
      const clampedH = ((nextHours24 % 24) + 24) % 24;
      const clampedM = ((nextMinutes % 60) + 60) % 60;
      onChange(`${nextDateKey}T${formatTimeKey(clampedH, clampedM)}`);
    },
    [onChange]
  );

  const handleStepHour = useCallback(
    (delta: number) => {
      const activeDate = value ? parsed.dateKey : todayKey;
      updateDateTime(activeDate, parsed.hours24 + delta, parsed.minutes);
    },
    [value, parsed.dateKey, parsed.hours24, parsed.minutes, todayKey, updateDateTime]
  );

  const handleStepMinute = useCallback(
    (delta: number) => {
      const activeDate = value ? parsed.dateKey : todayKey;
      updateDateTime(activeDate, parsed.hours24, parsed.minutes + delta);
    },
    [value, parsed.dateKey, parsed.hours24, parsed.minutes, todayKey, updateDateTime]
  );

  const handleSetMeridiem = useCallback(
    (wantPm: boolean) => {
      const activeDate = value ? parsed.dateKey : todayKey;
      const isCurrentlyPm = parsed.hours24 >= 12;
      if (wantPm === isCurrentlyPm) return;

      const nextH24 = wantPm ? parsed.hours24 + 12 : parsed.hours24 - 12;
      updateDateTime(activeDate, nextH24, parsed.minutes);
    },
    [value, parsed.dateKey, parsed.hours24, parsed.minutes, todayKey, updateDateTime]
  );

  // Non-passive mouse wheel / trackpad scroll listeners for Hour, Minute, and AM/PM drums
  useEffect(() => {
    if (!isOpen) return;

    const hourEl = hourWheelRef.current;
    const minuteEl = minuteWheelRef.current;
    const meridiemEl = meridiemWheelRef.current;

    let hourAccum = 0;
    let minuteAccum = 0;
    const WHEEL_THRESHOLD = 35;

    const onHourWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      hourAccum += e.deltaY;
      if (Math.abs(hourAccum) >= WHEEL_THRESHOLD) {
        const direction = hourAccum > 0 ? 1 : -1;
        hourAccum = 0;
        handleStepHour(direction);
      }
    };

    const onMinuteWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      minuteAccum += e.deltaY;
      if (Math.abs(minuteAccum) >= WHEEL_THRESHOLD) {
        const direction = minuteAccum > 0 ? 1 : -1;
        minuteAccum = 0;
        handleStepMinute(direction);
      }
    };

    const onMeridiemWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (Math.abs(e.deltaY) >= 15) {
        handleSetMeridiem(e.deltaY > 0);
      }
    };

    hourEl?.addEventListener("wheel", onHourWheel, { passive: false });
    minuteEl?.addEventListener("wheel", onMinuteWheel, { passive: false });
    meridiemEl?.addEventListener("wheel", onMeridiemWheel, { passive: false });

    return () => {
      hourEl?.removeEventListener("wheel", onHourWheel);
      minuteEl?.removeEventListener("wheel", onMinuteWheel);
      meridiemEl?.removeEventListener("wheel", onMeridiemWheel);
    };
  }, [isOpen, handleStepHour, handleStepMinute, handleSetMeridiem]);

  const weekdayHeaders = useMemo(
    () =>
      locale === "vi"
        ? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
        : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    [locale]
  );

  const monthTitle = useMemo(() => {
    return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
      month: "long",
      year: "numeric",
    }).format(viewMonth);
  }, [viewMonth, locale]);

  // Build calendar cells for viewMonth (Monday-first grid)
  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDays = lastDayOfMonth.getDate();

    const cells: Array<{
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isPast: boolean;
      isToday: boolean;
    }> = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const key = toDateKey(d);
      cells.push({
        dateKey: key,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isPast: key < todayKey,
        isToday: key === todayKey,
      });
    }

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const key = toDateKey(d);
      cells.push({
        dateKey: key,
        dayNumber: day,
        isCurrentMonth: true,
        isPast: key < todayKey,
        isToday: key === todayKey,
      });
    }

    const targetCells = cells.length > 35 ? 42 : 35;
    let nextMonthDay = 1;
    while (cells.length < targetCells) {
      const d = new Date(year, month + 1, nextMonthDay++);
      const key = toDateKey(d);
      cells.push({
        dateKey: key,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isPast: key < todayKey,
        isToday: key === todayKey,
      });
    }

    return cells;
  }, [viewMonth, todayKey]);

  const handleSelectDate = (nextDateKey: string) => {
    updateDateTime(nextDateKey, parsed.hours24, parsed.minutes);
    const [y, m] = nextDateKey.split("-").map(Number);
    if (
      y !== viewMonth.getFullYear() ||
      m - 1 !== viewMonth.getMonth()
    ) {
      setViewMonth(new Date(y, m - 1, 1));
    }
  };

  const handleHourInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") return;
    const num = parseInt(raw, 10);
    if (Number.isNaN(num)) return;

    const activeDate = value ? parsed.dateKey : todayKey;
    if (locale === "vi") {
      const clamped = Math.min(23, Math.max(0, num));
      updateDateTime(activeDate, clamped, parsed.minutes);
    } else {
      const isPm = parsed.hours24 >= 12;
      const clamped12 = Math.min(12, Math.max(1, num));
      const nextH24 =
        clamped12 === 12
          ? isPm
            ? 12
            : 0
          : isPm
          ? clamped12 + 12
          : clamped12;
      updateDateTime(activeDate, nextH24, parsed.minutes);
    }
  };

  const handleMinuteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") return;
    const num = parseInt(raw, 10);
    if (Number.isNaN(num)) return;

    const activeDate = value ? parsed.dateKey : todayKey;
    const clampedM = Math.min(59, Math.max(0, num));
    updateDateTime(activeDate, parsed.hours24, clampedM);
  };

  const displayHourValue = useMemo(
    () => formatHourNumber(parsed.hours24, locale),
    [parsed.hours24, locale]
  );

  const prevHourDisplay = useMemo(
    () => formatHourNumber(parsed.hours24 - 1, locale),
    [parsed.hours24, locale]
  );
  const nextHourDisplay = useMemo(
    () => formatHourNumber(parsed.hours24 + 1, locale),
    [parsed.hours24, locale]
  );

  const displayMinuteValue = useMemo(
    () => formatMinuteNumber(parsed.minutes),
    [parsed.minutes]
  );
  const prevMinuteDisplay = useMemo(
    () => formatMinuteNumber(parsed.minutes - 1),
    [parsed.minutes]
  );
  const nextMinuteDisplay = useMemo(
    () => formatMinuteNumber(parsed.minutes + 1),
    [parsed.minutes]
  );

  const isPm = parsed.hours24 >= 12;

  const formattedDisplayValue = useMemo(() => {
    if (!value) return "";
    const [y, m, d] = parsed.dateKey.split("-").map(Number);
    const dateObj = new Date(y, (m || 1) - 1, d || 1);
    if (Number.isNaN(dateObj.getTime())) return value;

    const dateFormatted = new Intl.DateTimeFormat(
      locale === "vi" ? "vi-VN" : "en-US",
      {
        weekday: "short",
        month: "short",
        day: "numeric",
      }
    ).format(dateObj);

    const timeFormatted = formatTimeDisplay(
      parsed.hours24,
      parsed.minutes,
      locale
    );
    return `${dateFormatted} • ${timeFormatted}`;
  }, [value, parsed, locale]);

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          if (!value) {
            onChange(`${todayKey}T19:00`);
          }
          setIsOpen((prev) => !prev);
        }}
        aria-expanded={isOpen}
        className={`w-full h-11 flex items-center justify-between px-3.5 bg-canvas-soft border border-border rounded-[12px] text-xs font-semibold text-ink cursor-pointer transition-colors duration-150 hover:border-ink/60 focus:outline-none focus:border-ink ${
          isOpen ? "border-ink shadow-xs bg-canvas" : ""
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar className="w-4 h-4 text-ink shrink-0" />
          {formattedDisplayValue ? (
            <span className="truncate text-ink font-bold">
              {formattedDisplayValue}
            </span>
          ) : (
            <span className="truncate text-mute font-medium">
              {t("createEvent.dateTimePlaceholder")}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-mute shrink-0 transition-transform duration-200 ml-2 ${
            isOpen ? "rotate-180 text-ink" : ""
          }`}
        />
      </button>

      {/* Rich DateTime Popover */}
      {isOpen && (
        <div className="dropdown-popover absolute z-50 left-0 sm:w-[340px] w-full mt-2 p-4 bg-canvas border border-border rounded-[20px] shadow-2xl space-y-4">
          {/* Calendar Month Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-[900] text-ink capitalize tracking-tight">
                {monthTitle}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setViewMonth(
                      new Date(
                        viewMonth.getFullYear(),
                        viewMonth.getMonth() - 1,
                        1
                      )
                    )
                  }
                  className="p-1.5 rounded-full bg-canvas-soft hover:bg-border/60 text-ink transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setViewMonth(
                      new Date(
                        viewMonth.getFullYear(),
                        viewMonth.getMonth() + 1,
                        1
                      )
                    )
                  }
                  className="p-1.5 rounded-full bg-canvas-soft hover:bg-border/60 text-ink transition cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Weekday Header Row */}
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-mute uppercase tracking-wider">
              {weekdayHeaders.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell) => {
                const isSelected =
                  Boolean(value) && parsed.dateKey === cell.dateKey;

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    disabled={cell.isPast}
                    onClick={() => handleSelectDate(cell.dateKey)}
                    className={`h-8 rounded-[10px] text-xs font-semibold flex items-center justify-center transition ${
                      cell.isPast
                        ? "opacity-30 cursor-not-allowed text-mute"
                        : isSelected
                        ? "bg-primary text-ink font-[900] border border-ink shadow-2xs cursor-pointer"
                        : cell.isToday
                        ? "bg-primary-pale text-positive-deep font-bold border border-primary-neutral cursor-pointer hover:bg-primary/60"
                        : cell.isCurrentMonth
                        ? "text-ink hover:bg-canvas-soft cursor-pointer"
                        : "text-mute/60 hover:bg-canvas-soft cursor-pointer"
                    }`}
                  >
                    {cell.dayNumber}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Wheel + Stepper Hour & Minute Time Picker */}
          <div className="pt-3 border-t border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-mute flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-ink" />
                <span>{t("createEvent.selectTimeLabel")}</span>
              </span>
              <span className="text-xs font-mono font-bold text-ink bg-canvas-soft px-2.5 py-0.5 rounded-full border border-border">
                {formatTimeDisplay(parsed.hours24, parsed.minutes, locale)}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2.5 bg-canvas-soft/70 p-2.5 rounded-[14px] border border-border">
              {/* Hour Drum (Scroll with mouse wheel/trackpad, click, or type) */}
              <div
                ref={hourWheelRef}
                className="flex flex-col items-center cursor-ns-resize px-1"
              >
                <button
                  type="button"
                  onClick={() => handleStepHour(-1)}
                  className="p-0.5 text-mute hover:text-ink rounded-full transition cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStepHour(-1)}
                  className="text-[11px] font-mono text-mute/60 hover:text-ink py-0.5 transition cursor-pointer"
                >
                  {prevHourDisplay}
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={displayHourValue}
                  onChange={handleHourInputChange}
                  className="w-12 h-8 text-center font-mono font-[900] text-sm text-ink bg-canvas border border-ink rounded-[10px] shadow-2xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleStepHour(1)}
                  className="text-[11px] font-mono text-mute/60 hover:text-ink py-0.5 transition cursor-pointer"
                >
                  {nextHourDisplay}
                </button>
                <button
                  type="button"
                  onClick={() => handleStepHour(1)}
                  className="p-0.5 text-mute hover:text-ink rounded-full transition cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

              <span className="font-mono font-[900] text-base text-ink">:</span>

              {/* Minute Drum (Scroll with mouse wheel/trackpad, click, or type) */}
              <div
                ref={minuteWheelRef}
                className="flex flex-col items-center cursor-ns-resize px-1"
              >
                <button
                  type="button"
                  onClick={() => handleStepMinute(-1)}
                  className="p-0.5 text-mute hover:text-ink rounded-full transition cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStepMinute(-1)}
                  className="text-[11px] font-mono text-mute/60 hover:text-ink py-0.5 transition cursor-pointer"
                >
                  {prevMinuteDisplay}
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={displayMinuteValue}
                  onChange={handleMinuteInputChange}
                  className="w-12 h-8 text-center font-mono font-[900] text-sm text-ink bg-canvas border border-ink rounded-[10px] shadow-2xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleStepMinute(1)}
                  className="text-[11px] font-mono text-mute/60 hover:text-ink py-0.5 transition cursor-pointer"
                >
                  {nextMinuteDisplay}
                </button>
                <button
                  type="button"
                  onClick={() => handleStepMinute(1)}
                  className="p-0.5 text-mute hover:text-ink rounded-full transition cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

              {/* AM / PM Segmented Drum (English 12h Mode) */}
              {locale !== "vi" && (
                <div
                  ref={meridiemWheelRef}
                  className="flex flex-col gap-1.5 ml-1.5 cursor-ns-resize"
                >
                  <button
                    type="button"
                    onClick={() => handleSetMeridiem(false)}
                    className={`px-2.5 py-1.5 rounded-[8px] text-[11px] font-bold border transition cursor-pointer ${
                      !isPm
                        ? "bg-primary text-ink border-ink shadow-2xs"
                        : "bg-canvas text-mute border-border hover:text-ink"
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetMeridiem(true)}
                    className={`px-2.5 py-1.5 rounded-[8px] text-[11px] font-bold border transition cursor-pointer ${
                      isPm
                        ? "bg-primary text-ink border-ink shadow-2xs"
                        : "bg-canvas text-mute border-border hover:text-ink"
                    }`}
                  >
                    PM
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Popover Footer */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-ink truncate">
              {formattedDisplayValue}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn-primary px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t("common.confirm")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
