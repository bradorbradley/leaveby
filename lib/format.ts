/** Time helpers. Everything is displayed in the airport's timezone. */

export function fmtTime(iso: string, tz: string) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { hm: `${get("hour")}:${get("minute")}`, ampm: get("dayPeriod").toUpperCase() };
}

export function fmtTimeShort(iso: string, tz: string) {
  const t = fmtTime(iso, tz);
  return `${t.hm} ${t.ampm}`;
}

export function fmtDay(iso: string, tz: string, now = new Date()) {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const tomorrow = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(now.getTime() + 86_400_000),
  );
  const pretty = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" }).format(d);
  if (day === today) return { rel: "Today", pretty };
  if (day === tomorrow) return { rel: "Tomorrow", pretty };
  return { rel: null, pretty };
}

export function tzAbbrev(iso: string, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(new Date(iso));
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}

export function deviceTz() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "";
  }
}

export function minutesBetween(aIso: string, bIso: string) {
  return Math.round((new Date(bIso).getTime() - new Date(aIso).getTime()) / 60_000);
}

export function localDateString(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function prettyDate(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}
