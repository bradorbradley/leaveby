import { getTerminalProfile, isPeakTravelDate, isTerminalServiceOpen } from "@/lib/airports";
import { instantToZonedParts } from "@/lib/tz";
import type { AirportCode } from "@/types/airport";
import type { CalculationOptions } from "@/types/calculation";
import type { SecurityEstimate } from "@/types/security";

/**
 * Estimate the security wait from curated terminal intelligence: baseline
 * waits by terminal, adjusted for time of day, peak travel dates, and the
 * traveler's expedited-screening access.
 */
export async function fetchSecurityWaitTime(
  airportCode: AirportCode,
  terminalId: string | null,
  departureTime: Date,
  options: Pick<CalculationOptions, "hasClear" | "hasPreCheck" | "hasGlobalEntry" | "hasTouchlessId">,
  timezone = "America/New_York",
): Promise<SecurityEstimate> {
  const terminal = getTerminalProfile(airportCode, terminalId);
  if (!terminal) {
    throw new Error("Terminal not available for security calculation.");
  }

  // Judge the line at roughly when the traveler reaches the checkpoint
  // (about 75 minutes before departure).
  const atCheckpoint = new Date(departureTime.getTime() - 75 * 60 * 1000);
  const local = instantToZonedParts(atCheckpoint, timezone);
  const window = classifyWindow(local.hour, terminal.peakWindows);
  const peak = isPeakTravelDate(departureTime, timezone);

  let baseWait = terminal.security.waitEstimate[window];
  if (peak.isPeak && peak.level === "extreme") {
    baseWait = Math.max(baseWait, terminal.security.waitEstimate.holiday);
  } else if (peak.isPeak) {
    baseWait = Math.round(baseWait * peak.multiplier);
  }

  const adjusted = adjustSecurityForAccess(baseWait, airportCode, terminal.id, atCheckpoint, options, timezone);
  const windowLabel =
    window === "peak" ? "a peak checkpoint window" : window === "normal" ? "a moderately busy window" : "an off-peak window";

  const notes = [
    `${terminal.name} lines around ${local.hhmm} local time fall in ${windowLabel} — about ${baseWait} min standard.`,
  ];
  if (adjusted < baseWait) {
    notes.push(`Your expedited screening cuts that to roughly ${adjusted} min.`);
  }
  if (peak.isPeak && peak.label) {
    notes.push(`${peak.label} is in effect, so lines run longer than usual.`);
  }
  notes.push(...terminal.security.notes);

  return {
    terminal: terminal.id,
    airportCode,
    baseWaitMinutes: baseWait,
    adjustedWaitMinutes: adjusted,
    confidence: "estimated",
    usedSources: ["Terminal intelligence model (time of day, peak calendar, expedited access)"],
    sourceNotes: notes,
  };
}

function classifyWindow(hour: number, peakWindows: string[]): "offPeak" | "normal" | "peak" {
  for (const window of peakWindows) {
    const range = parsePeakWindow(window);
    if (!range) continue;
    if (hour >= range.start && hour < range.end) return "peak";
    if (hour >= range.start - 1 && hour < range.end + 1) return "normal";
  }
  if (hour >= 5 && hour < 21) return "normal";
  return "offPeak";
}

function parsePeakWindow(window: string): { start: number; end: number } | null {
  const match = window.match(/(\d{1,2}):\d{2}(am|pm)\s*-\s*(\d{1,2}):\d{2}(am|pm)/i);
  if (!match) return null;
  const toHour = (raw: string, suffix: string) => {
    let hour = Number(raw) % 12;
    if (suffix.toLowerCase() === "pm") hour += 12;
    return hour;
  };
  return { start: toHour(match[1], match[2]), end: toHour(match[3], match[4]) };
}

function adjustSecurityForAccess(
  waitMinutes: number,
  airportCode: AirportCode,
  terminalId: string,
  atTime: Date,
  options: Pick<CalculationOptions, "hasClear" | "hasPreCheck" | "hasGlobalEntry" | "hasTouchlessId">,
  timezone?: string,
) {
  if (options.hasTouchlessId && isTerminalServiceOpen(airportCode, terminalId, "touchless-id", atTime, timezone)) {
    return Math.max(5, Math.round(waitMinutes * 0.15));
  }

  if (options.hasClear && isTerminalServiceOpen(airportCode, terminalId, "clear", atTime, timezone)) {
    return Math.max(8, Math.round(waitMinutes * 0.35));
  }

  if ((options.hasPreCheck || options.hasGlobalEntry) && isTerminalServiceOpen(airportCode, terminalId, "precheck", atTime, timezone)) {
    return Math.max(7, Math.round(waitMinutes * 0.48));
  }

  return waitMinutes;
}
