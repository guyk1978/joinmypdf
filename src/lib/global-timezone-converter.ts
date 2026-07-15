/** IANA zones with short marketing labels for the Global Time Zone Converter. */

export type GlobalTimezoneZone = {
  id: string;
  labelKey: string;
  timeZone: string;
  shortCode: string;
};

export const GLOBAL_TIMEZONE_ZONES: GlobalTimezoneZone[] = [
  { id: "utc", labelKey: "utc", timeZone: "UTC", shortCode: "UTC" },
  { id: "new-york", labelKey: "newYork", timeZone: "America/New_York", shortCode: "ET" },
  { id: "los-angeles", labelKey: "losAngeles", timeZone: "America/Los_Angeles", shortCode: "PT" },
  { id: "chicago", labelKey: "chicago", timeZone: "America/Chicago", shortCode: "CT" },
  { id: "london", labelKey: "london", timeZone: "Europe/London", shortCode: "GMT/BST" },
  { id: "paris", labelKey: "paris", timeZone: "Europe/Paris", shortCode: "CET" },
  { id: "berlin", labelKey: "berlin", timeZone: "Europe/Berlin", shortCode: "CET" },
  { id: "dubai", labelKey: "dubai", timeZone: "Asia/Dubai", shortCode: "GST" },
  { id: "mumbai", labelKey: "mumbai", timeZone: "Asia/Kolkata", shortCode: "IST" },
  { id: "jerusalem", labelKey: "jerusalem", timeZone: "Asia/Jerusalem", shortCode: "IST" },
  { id: "singapore", labelKey: "singapore", timeZone: "Asia/Singapore", shortCode: "SGT" },
  { id: "tokyo", labelKey: "tokyo", timeZone: "Asia/Tokyo", shortCode: "JST" },
  { id: "sydney", labelKey: "sydney", timeZone: "Australia/Sydney", shortCode: "AET" },
];

export const DEFAULT_TARGET_ZONE_IDS = ["utc", "new-york", "london", "mumbai"] as const;

export const FAVORITES_STORAGE_KEY = "joinmypdf.global-timezone.favorites";

export type ClockParts = {
  time24: string;
  time12: string;
  date: string;
  offset: string;
  weekday: string;
};

export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function findGlobalTimezoneZone(id: string): GlobalTimezoneZone | undefined {
  return GLOBAL_TIMEZONE_ZONES.find((zone) => zone.id === id);
}

export function findZoneByIana(timeZone: string): GlobalTimezoneZone | undefined {
  return GLOBAL_TIMEZONE_ZONES.find((zone) => zone.timeZone === timeZone);
}

/** Offset of `timeZone` at `date` in milliseconds (UTC = local + offset → wall). */
export function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }

  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour === "24" ? "0" : map.hour),
    Number(map.minute),
    Number(map.second),
  );

  return asUtc - date.getTime();
}

/**
 * Interpret a wall-clock datetime (`YYYY-MM-DDTHH:mm`) as occurring in `timeZone`,
 * return the absolute UTC `Date`. Accounts for DST via Intl offset probing.
 */
export function wallTimeInZoneToDate(wallLocal: string, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(wallLocal.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");

  if (![year, month, day, hour, minute, second].every(Number.isFinite)) return null;

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset = getTimeZoneOffsetMs(utcGuess, timeZone);
  let absolute = new Date(utcGuess.getTime() - offset);

  // Re-probe once — handles DST transition edge cases.
  const correctedOffset = getTimeZoneOffsetMs(absolute, timeZone);
  if (correctedOffset !== offset) {
    absolute = new Date(utcGuess.getTime() - correctedOffset);
  }

  return absolute;
}

export function formatDateTimeLocalValue(date: Date, timeZone: string): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }

  const hour = map.hour === "24" ? "00" : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
}

export function formatClockParts(timeZone: string, locale: string, instant: Date): ClockParts {
  const time24 = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(instant);

  const time12 = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(instant);

  const date = new Intl.DateTimeFormat(locale, {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(instant);

  const weekday = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "short",
  }).format(instant);

  const offset =
    new Intl.DateTimeFormat(locale, {
      timeZone,
      timeZoneName: "shortOffset",
    })
      .formatToParts(instant)
      .find((part) => part.type === "timeZoneName")?.value ?? "";

  return { time24, time12, date, offset, weekday };
}

export type MeetingLinkPoint = {
  cityLabel: string;
  timeZone: string;
};

/** Build “Meeting scheduled for 10:00 AM (Tel Aviv) / 3:00 AM (New York)” copy. */
export function buildMeetingLinkText(
  instant: Date,
  points: MeetingLinkPoint[],
  locale: string,
): string | null {
  if (points.length < 2) return null;

  const segments = points.map((point) => {
    const time = new Intl.DateTimeFormat(locale, {
      timeZone: point.timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(instant);
    return `${time} (${point.cityLabel})`;
  });

  return `Meeting scheduled for ${segments.join(" / ")}`;
}

export function loadFavoriteZoneIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function saveFavoriteZoneIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Quota / private mode — ignore.
  }
}
