import data from "@/lib/tsa-volumes.json";

export type DayCount = { date: string; weekday: number; count: number };

export const TSA_SOURCE = data.source;
export const TSA_CHECKED = data.checked;

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Every day TSA has published, oldest first, as ISO dates (counts are whole-country checkpoint screenings). */
export function tsaDays(): DayCount[] {
  const start = Date.parse(`${data.start}T00:00:00Z`);
  return data.counts.map((count, i) => {
    const d = new Date(start + i * 86_400_000);
    return { date: d.toISOString().slice(0, 10), weekday: d.getUTCDay(), count };
  });
}

export function daysInYear(year: number, days = tsaDays()): DayCount[] {
  return days.filter((d) => d.date.startsWith(`${year}-`));
}

export function busiest(days: DayCount[], n: number): DayCount[] {
  return [...days].sort((a, b) => b.count - a.count).slice(0, n);
}

/** Average screenings per weekday, Sunday first. */
export function weekdayAverages(days: DayCount[]): { day: string; avg: number }[] {
  return WEEKDAYS.map((day, i) => {
    const xs = days.filter((d) => d.weekday === i);
    return { day, avg: xs.length ? Math.round(xs.reduce((s, d) => s + d.count, 0) / xs.length) : 0 };
  });
}

export function total(days: DayCount[]): number {
  return days.reduce((s, d) => s + d.count, 0);
}

/** "Sun, Nov 30, 2025" */
export function formatDay(iso: string, withYear = true): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

export const fmt = (n: number) => n.toLocaleString("en-US");
