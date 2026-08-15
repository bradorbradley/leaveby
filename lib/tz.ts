import { formatISO } from "date-fns";

/** Normalize a FlightAware-style timezone (":America/New_York") to IANA. */
export function normalizeTimezone(tz: string | null | undefined, fallback = "America/New_York") {
  if (!tz) return fallback;
  return tz.replace(/^:/, "");
}

/** Get date/time parts of an instant expressed in a specific IANA timezone. */
export function instantToZonedParts(instant: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = Object.fromEntries(formatter.formatToParts(instant).map((part) => [part.type, part.value]));
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return {
    isoDate: `${parts.year}-${parts.month}-${parts.day}`,
    hhmm: `${hour}:${parts.minute}`,
    hour: Number(hour),
    minute: Number(parts.minute),
    weekday: parts.weekday,
  };
}

/** Format an instant as a friendly label in a specific timezone, e.g. "Sun, Aug 16 • 7:00am". */
export function formatInZone(instant: Date, timezone: string) {
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(instant);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(instant)
    .toLowerCase()
    .replace(" ", "");
  return `${date} • ${time}`;
}

/** Convert a wall-clock date + HH:mm in a timezone into a UTC ISO string. */
export function zonedTimeToUtcISO(date: string, hhmm: string, timezone: string): string {
  const localTimeStr = `${date}T${hhmm}:00`;
  try {
    const utcGuess = new Date(`${localTimeStr}Z`);
    const localAtUtc = new Date(utcGuess.toLocaleString("en-US", { timeZone: timezone }));
    const offsetMs = localAtUtc.getTime() - utcGuess.getTime();
    return formatISO(new Date(utcGuess.getTime() - offsetMs));
  } catch {
    return formatISO(new Date(localTimeStr));
  }
}
