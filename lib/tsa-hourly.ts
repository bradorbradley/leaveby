import data from "@/lib/tsa-hourly.json";

export const HOURLY_SOURCE = data.source;
export const HOURLY_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** People screened nationally per local hour, one row per day of the week of Sep 13–19, 2026 (Sunday first). */
export const hourlyGrid = (): number[][] => data.counts;

/** Average people screened in each hour of the day across the week. */
export function averageByHour(grid = hourlyGrid()): number[] {
  return Array.from({ length: 24 }, (_, h) => Math.round(grid.reduce((s, row) => s + row[h], 0) / grid.length));
}

/** Share of the week's screenings that fell in the given hours, as a percentage. */
export function shareOfHours(hours: number[], grid = hourlyGrid()): number {
  const all = grid.flat().reduce((a, b) => a + b, 0);
  const part = grid.reduce((s, row) => s + hours.reduce((t, h) => t + row[h], 0), 0);
  return (part / all) * 100;
}

/** "5am", "12pm", "11pm" */
export function hourLabel(h: number): string {
  const n = h % 12 === 0 ? 12 : h % 12;
  return `${n}${h < 12 ? "am" : "pm"}`;
}
