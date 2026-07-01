export type TimezoneCity = {
  id: string;
  labelKey: string;
  timeZone: string;
};

export const TIMEZONE_CITY_OPTIONS: TimezoneCity[] = [
  { id: "utc", labelKey: "utc", timeZone: "UTC" },
  { id: "new-york", labelKey: "newYork", timeZone: "America/New_York" },
  { id: "los-angeles", labelKey: "losAngeles", timeZone: "America/Los_Angeles" },
  { id: "london", labelKey: "london", timeZone: "Europe/London" },
  { id: "paris", labelKey: "paris", timeZone: "Europe/Paris" },
  { id: "dubai", labelKey: "dubai", timeZone: "Asia/Dubai" },
  { id: "tokyo", labelKey: "tokyo", timeZone: "Asia/Tokyo" },
  { id: "sydney", labelKey: "sydney", timeZone: "Australia/Sydney" },
  { id: "jerusalem", labelKey: "jerusalem", timeZone: "Asia/Jerusalem" },
  { id: "singapore", labelKey: "singapore", timeZone: "Asia/Singapore" },
];

export type ClockDisplay = {
  time: string;
  date: string;
  offset: string;
};

export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function formatClock(timeZone: string, locale: string, now = new Date()): ClockDisplay {
  const time = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  const date = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(now);

  const offset =
    new Intl.DateTimeFormat(locale, {
      timeZone,
      timeZoneName: "shortOffset",
    })
      .formatToParts(now)
      .find((part) => part.type === "timeZoneName")?.value ?? "";

  return { time, date, offset };
}

export function findTimezoneCity(id: string): TimezoneCity | undefined {
  return TIMEZONE_CITY_OPTIONS.find((city) => city.id === id);
}
