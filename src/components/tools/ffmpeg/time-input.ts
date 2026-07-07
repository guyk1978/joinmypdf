/** Parse `mm:ss` (minutes 0–999, seconds 00–59). */
const MM_SS_PATTERN = /^(\d{1,3}):([0-5]\d)$/;

export type ParsedTime = {
  seconds: number;
  normalized: string;
};

export function parseMmSs(value: string): ParsedTime | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(MM_SS_PATTERN);
  if (!match) return null;

  const minutes = Number(match[1]);
  const secs = Number(match[2]);
  const seconds = minutes * 60 + secs;

  return {
    seconds,
    normalized: `${String(minutes).padStart(2, "0")}:${match[2]}`,
  };
}

export function formatMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function validateTrimRange(
  startValue: string,
  endValue: string,
  maxDurationSeconds?: number,
): string | null {
  const start = parseMmSs(startValue);
  if (!start) {
    return "Enter a valid start time in mm:ss format (e.g. 00:30).";
  }

  const end = parseMmSs(endValue);
  if (!end) {
    return "Enter a valid end time in mm:ss format (e.g. 02:15).";
  }

  if (start.seconds >= end.seconds) {
    return "Start time must be earlier than end time.";
  }

  if (maxDurationSeconds !== undefined && end.seconds > maxDurationSeconds + 0.5) {
    return `End time cannot exceed the track duration (${formatMmSs(maxDurationSeconds)}).`;
  }

  return null;
}
