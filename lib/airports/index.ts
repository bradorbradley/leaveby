import { format } from "date-fns";

import { airlineProfiles, airportProfiles, peakTravelWindows } from "@/lib/airports/data";
import type { AirlineProfile, AirportCode, AirportProfile, TerminalProfile } from "@/types/airport";

export function getAirportProfile(code: AirportCode): AirportProfile {
  return airportProfiles[code];
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

export function isPeakTravelDate(date: Date) {
  const isoDate = format(date, "yyyy-MM-dd");
  const peakWindow = peakTravelWindows.find((window) => window.dates.includes(isoDate));
  if (peakWindow) {
    return {
      isPeak: true,
      level: peakWindow.level,
      multiplier: peakWindow.multiplier,
      label: peakWindow.name,
    };
  }

  const day = date.getDay();
  const hours = date.getHours();
  if (day === 5 || day === 0) {
    return { isPeak: true, level: "high" as const, multiplier: 1.25, label: "Busy weekend travel pattern" };
  }
  if (day === 1 && hours < 10) {
    return { isPeak: true, level: "moderate" as const, multiplier: 1.18, label: "Monday business-travel push" };
  }
  return { isPeak: false, level: null, multiplier: 1, label: null };
}

export function isTerminalServiceOpen(
  airportCode: AirportCode,
  terminalId: string | null | undefined,
  service: "precheck" | "clear" | "reserve" | "touchless-id",
  atTime: Date,
) {
  const terminal = getTerminalProfile(airportCode, terminalId);
  const hours = terminal?.security.serviceHours?.[service];
  if (!hours) return Boolean(terminal?.security.services[service]);

  const hhmm = format(atTime, "HH:mm");
  return hhmm >= hours.opensAt && hhmm <= hours.closesAt;
}
