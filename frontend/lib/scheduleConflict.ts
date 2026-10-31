import { EventActivity } from "@/types/models";

const DEFAULT_DURATION_MINUTES = 90;

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function parse12HourTimeToMinutes(timeStr: string): number | null {
  const match = timeStr
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hours < 12) {
    hours += 12;
  } else if (meridiem === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

function getRelativeDayLabels(date: Date): {
  isoDate: string;
  dayKeys: string[];
} {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const diffDays = Math.round(
    (targetStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
  const weekday = WEEKDAYS[date.getDay()];

  const keys = [isoDate];
  if (diffDays >= 0 && diffDays < 7) {
    keys.push(weekday);
  }
  if (diffDays === 0) keys.push("today");
  if (diffDays === 1) keys.push("tomorrow");
  return { isoDate, dayKeys: keys };
}

/**
 * Parses an EventActivity schedule into one or more comparable day keys
 * and a `[startMinutes, endMinutes]` interval.
 */
export function parseEventSchedule(
  event: Pick<EventActivity, "dateTimeStr" | "startTimeIso" | "endTimeIso">
): {
  isoDate?: string;
  dayKeys: string[];
  startMinutes: number;
  endMinutes: number;
} | null {
  // 1. Check ISO timestamp if available
  if (event.startTimeIso) {
    const parsedDate = new Date(event.startTimeIso);
    if (!Number.isNaN(parsedDate.getTime())) {
      const startMinutes =
        parsedDate.getHours() * 60 + parsedDate.getMinutes();

      let endMinutes = startMinutes + DEFAULT_DURATION_MINUTES;
      if (event.endTimeIso) {
        const parsedEnd = new Date(event.endTimeIso);
        if (!Number.isNaN(parsedEnd.getTime())) {
          const candidateEnd =
            parsedEnd.getHours() * 60 + parsedEnd.getMinutes();
          if (candidateEnd > startMinutes) {
            endMinutes = candidateEnd;
          }
        }
      }

      const { isoDate, dayKeys } = getRelativeDayLabels(parsedDate);
      return {
        isoDate,
        dayKeys,
        startMinutes,
        endMinutes,
      };
    }
  }

  const raw = event.dateTimeStr.trim();

  // 2. Check pattern: "<DayLabel>, <StartTime> [- <EndTime>]"
  // e.g. "Today, 7:00 PM - 8:30 PM" or "Friday, 5:30 PM"
  const commaIdx = raw.lastIndexOf(",");
  if (commaIdx !== -1) {
    const dayPart = raw.slice(0, commaIdx).trim().toLowerCase();
    const timePart = raw.slice(commaIdx + 1).trim();

    const rangeParts = timePart.split(/\s*[-–]\s*/);
    const startMinutes = parse12HourTimeToMinutes(rangeParts[0]);
    if (startMinutes !== null) {
      const endMinutes =
        rangeParts[1] !== undefined
          ? parse12HourTimeToMinutes(rangeParts[1]) ??
            startMinutes + DEFAULT_DURATION_MINUTES
          : startMinutes + DEFAULT_DURATION_MINUTES;

      return {
        dayKeys: [dayPart],
        startMinutes,
        endMinutes,
      };
    }
  }

  // 3. Fallback: try native Date.parse on dateTimeStr
  const fallbackDate = new Date(raw);
  if (!Number.isNaN(fallbackDate.getTime())) {
    const startMinutes =
      fallbackDate.getHours() * 60 + fallbackDate.getMinutes();
    const { isoDate, dayKeys } = getRelativeDayLabels(fallbackDate);
    return {
      isoDate,
      dayKeys,
      startMinutes,
      endMinutes: startMinutes + DEFAULT_DURATION_MINUTES,
    };
  }

  return null;
}

/**
 * Returns true if two events occur on the same day and their time windows overlap.
 */
export function doEventsOverlap(
  eventA: Pick<EventActivity, "dateTimeStr" | "startTimeIso" | "endTimeIso">,
  eventB: Pick<EventActivity, "dateTimeStr" | "startTimeIso" | "endTimeIso">
): boolean {
  // Exact string match fallback
  if (
    eventA.dateTimeStr.trim().toLowerCase() ===
    eventB.dateTimeStr.trim().toLowerCase()
  ) {
    return true;
  }

  const parsedA = parseEventSchedule(eventA);
  const parsedB = parseEventSchedule(eventB);

  if (!parsedA || !parsedB) {
    return false;
  }

  const sharesDay =
    parsedA.isoDate && parsedB.isoDate
      ? parsedA.isoDate === parsedB.isoDate
      : parsedA.dayKeys.some((k) => parsedB.dayKeys.includes(k));
  if (!sharesDay) {
    return false;
  }

  // Overlap condition: [startA, endA) intersects [startB, endB)
  return (
    parsedA.startMinutes < parsedB.endMinutes &&
    parsedB.startMinutes < parsedA.endMinutes
  );
}

/**
 * Finds an already-joined event that conflicts in schedule with `candidateEvent`.
 */
export function findConflictingJoinedEvent(
  candidateEvent: Pick<
    EventActivity,
    "id" | "dateTimeStr" | "startTimeIso" | "endTimeIso"
  >,
  allEvents: EventActivity[]
): EventActivity | null {
  for (const ev of allEvents) {
    if (!ev.userJoined || ev.id === candidateEvent.id) {
      continue;
    }
    if (doEventsOverlap(candidateEvent, ev)) {
      return ev;
    }
  }
  return null;
}
