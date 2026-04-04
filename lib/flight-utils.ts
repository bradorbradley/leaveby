import { addDays, format } from "date-fns";

import { detectAirportTerminalByAirline, getAirlineProfile, listAirports } from "@/lib/airports";
import type { AirportCode } from "@/types/airport";

const AIRPORT_REGEX = /\b(ATL|AUS|BNA|BOS|CLT|DCA|DEN|DFW|DTW|EWR|FLL|IAD|IAH|JFK|LAS|LAX|LGA|MCO|MIA|MSP|ORD|PDX|PHL|PHX|SAN|SEA|SFO)\b/g;

export function parseFlightNumber(input: string) {
  const normalized = input.trim().toUpperCase().replace(/\s+/g, "");
  // Try 2-letter IATA code first (most common: DL, UA, AA, etc.)
  // Then fall back to 3-letter code (some carriers use 3)
  const match =
    normalized.match(/^([A-Z]{2})(\d{1,4}[A-Z]?)$/) ??
    normalized.match(/^([A-Z]\d)(\d{1,4}[A-Z]?)$/) ??
    normalized.match(/^([A-Z0-9]{3})(\d{1,4}[A-Z]?)$/);
  if (!match) {
    return null;
  }

  const [, airlineCode, flightDigits] = match;
  const airline = getAirlineProfile(airlineCode);
  return {
    airlineCode,
    flightDigits,
    normalized: `${airlineCode} ${flightDigits}`,
    airlineName: airline?.name ?? airlineCode,
  };
}

export function resolveDateFromPreset(preset: "today" | "tomorrow" | "custom", customDate?: string) {
  if (preset === "custom" && customDate) return customDate;
  return format(preset === "tomorrow" ? addDays(new Date(), 1) : new Date(), "yyyy-MM-dd");
}

export function detectAirportCodeFromText(text: string): AirportCode | null {
  const match = text.toUpperCase().match(AIRPORT_REGEX)?.[0] as AirportCode | undefined;
  return match ?? null;
}

export function guessDepartureAirport(originText: string): AirportCode {
  const upper = originText.toUpperCase();
  if (upper.includes("LAX") || upper.includes("LOS ANGELES")) return "LAX";
  if (upper.includes("ORD") || upper.includes("CHICAGO")) return "ORD";
  if (upper.includes("ATL") || upper.includes("ATLANTA")) return "ATL";
  return "JFK";
}

export function inferAirportFromFlightContext(flightText: string): AirportCode {
  const match = detectAirportCodeFromText(flightText);
  if (match) return match;
  const parsed = parseFlightNumber(flightText);
  if (parsed?.airlineCode) {
    return (listAirports().find((airport) =>
      airport.terminals.some((terminal) => terminal.airlines.includes(parsed.airlineCode)),
    )?.code ?? detectAirportTerminalByAirline("JFK", parsed.airlineCode) ?? "JFK") as AirportCode;
  }
  return "JFK";
}
