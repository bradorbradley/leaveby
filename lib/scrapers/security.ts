import { getTerminalProfile, isPeakTravelDate, isTerminalServiceOpen } from "@/lib/airports";
import type { AirportCode } from "@/types/airport";
import type { CalculationOptions } from "@/types/calculation";
import type { SecurityEstimate } from "@/types/security";

import { searchBrave } from "./brave";

export async function fetchSecurityWaitTime(
  airportCode: AirportCode,
  terminalId: string | null,
  flightDate: Date,
  options: Pick<CalculationOptions, "hasClear" | "hasPreCheck" | "hasGlobalEntry" | "hasTouchlessId">,
): Promise<SecurityEstimate> {
  const terminal = getTerminalProfile(airportCode, terminalId);
  if (!terminal) {
    throw new Error("Terminal not available for security calculation.");
  }

  const peak = isPeakTravelDate(flightDate);
  const baseWait = peak.isPeak ? terminal.security.waitEstimate.holiday : terminal.security.waitEstimate.normal;
  const query = `${airportCode} terminal ${terminal.id} TSA wait time today`;

  try {
    const results = await searchBrave(query);
    const text = results.map((result) => `${result.title} ${result.description}`).join(" ");
    const scraped = Number(text.match(/(\d{1,3})\s*(minute|min)/i)?.[1] ?? baseWait);

    return {
      terminal: terminal.id,
      airportCode,
      baseWaitMinutes: scraped,
      adjustedWaitMinutes: adjustSecurityForAccess(scraped, airportCode, terminal.id, flightDate, options),
      confidence: "live",
      usedSources: results.slice(0, 3).map((result) => result.url),
      sourceNotes: results.slice(0, 2).map((result) => result.description),
    };
  } catch {
    return {
      terminal: terminal.id,
      airportCode,
      baseWaitMinutes: baseWait,
      adjustedWaitMinutes: adjustSecurityForAccess(baseWait, airportCode, terminal.id, flightDate, options),
      confidence: "fallback",
      usedSources: ["Heuristic terminal data"],
      sourceNotes: ["Live security data unavailable. Terminal estimate and peak-day logic applied."],
    };
  }
}

function adjustSecurityForAccess(
  waitMinutes: number,
  airportCode: AirportCode,
  terminalId: string,
  atTime: Date,
  options: Pick<CalculationOptions, "hasClear" | "hasPreCheck" | "hasGlobalEntry" | "hasTouchlessId">,
) {
  if (
    options.hasTouchlessId &&
    isTerminalServiceOpen(airportCode, terminalId, "touchless-id", atTime)
  ) {
    return Math.max(5, Math.round(waitMinutes * 0.15));
  }

  if (options.hasClear && isTerminalServiceOpen(airportCode, terminalId, "clear", atTime)) {
    return Math.max(10, Math.round(waitMinutes * 0.35));
  }

  if (
    (options.hasPreCheck || options.hasGlobalEntry) &&
    isTerminalServiceOpen(airportCode, terminalId, "precheck", atTime)
  ) {
    return Math.max(8, Math.round(waitMinutes * 0.48));
  }

  return waitMinutes;
}
