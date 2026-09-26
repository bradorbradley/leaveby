import { airlineProfiles, airportProfiles, makeGenericAirport, peakTravelWindows } from "@/lib/airports/data";
import { worldAirport } from "@/lib/airports/world";
import { instantToZonedParts } from "@/lib/tz";
import type { AirlineProfile, AirportCode, AirportProfile, TerminalProfile } from "@/types/airport";

export interface AirportSeed {
  name?: string;
  city?: string;
  timezone?: string;
  coord?: { lat: number; lon: number };
}

/**
 * Look up a curated airport profile, or synthesize a sensible generic one so
 * any departure airport (not just the majors we've profiled) still works.
 */
export function getAirportProfile(code: AirportCode, seed?: AirportSeed): AirportProfile {
  const known = airportProfiles[code];
  if (known) return known;
  // Never default an unknown airport to another timezone: take its real one from the world table.
  const world = worldAirport(code);
  return makeGenericAirport(
    code,
    seed?.name ?? world?.name,
    seed?.timezone ?? world?.timezone,
    seed?.coord ?? (world ? { lat: world.lat, lon: world.lon } : undefined),
  );
}

export function listAirports(): AirportProfile[] {
  return Object.values(airportProfiles) as AirportProfile[];
}

export function getTerminalProfile(airportCode: AirportCode, terminalId?: string | null): TerminalProfile | null {
  const airport = getAirportProfile(airportCode);
  if (!terminalId) return airport.terminals[0] ?? null;
  return airport.terminals.find((terminal) => terminal.id === terminalId) ?? airport.terminals[0] ?? null;
}

export function getAirlineProfile(airlineCode: string): AirlineProfile | undefined {
  return airlineProfiles.find((airline) => airline.code === airlineCode.toUpperCase());
}

export function detectAirportTerminalByAirline(airportCode: AirportCode, airlineCode: string): string | null {
  return getAirlineProfile(airlineCode)?.airportAssignments[airportCode] ?? null;
}

export function isPeakTravelDate(date: Date, timezone = "America/New_York") {
  const local = instantToZonedParts(date, timezone);
  const peakWindow = peakTravelWindows.find((window) => window.dates.includes(local.isoDate));
  if (peakWindow) {
    return {
      isPeak: true,
      level: peakWindow.level,
      multiplier: peakWindow.multiplier,
      label: peakWindow.name,
    };
  }

  if (local.weekday === "Fri" || local.weekday === "Sun") {
    return { isPeak: true, level: "high" as const, multiplier: 1.25, label: "Busy weekend travel pattern" };
  }
  if (local.weekday === "Mon" && local.hour < 10) {
    return { isPeak: true, level: "moderate" as const, multiplier: 1.18, label: "Monday business-travel push" };
  }
  return { isPeak: false, level: null, multiplier: 1, label: null };
}

export function isTerminalServiceOpen(
  airportCode: AirportCode,
  terminalId: string | null | undefined,
  service: "precheck" | "clear" | "reserve" | "touchless-id",
  atTime: Date,
  timezone?: string,
) {
  const terminal = getTerminalProfile(airportCode, terminalId);
  const hours = terminal?.security.serviceHours?.[service];
  if (!hours) return Boolean(terminal?.security.services[service]);

  const hhmm = instantToZonedParts(atTime, timezone ?? getAirportProfile(airportCode).timezone).hhmm;
  return hhmm >= hours.opensAt && hhmm <= hours.closesAt;
}
