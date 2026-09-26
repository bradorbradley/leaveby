import { airlineProfiles } from "@/lib/airports/data";

/** Codes people type that aren't the airline's IATA code: Southwest is WN, not SW; some type ICAO codes like UAL. */
const AIRLINE_ALIASES: Record<string, string> = { SW: "WN", SWA: "WN", UAL: "UA", AAL: "AA", DAL: "DL", JBU: "B6", ASA: "AS", NKS: "NK", FFT: "F9", HAL: "HA", SKW: "OO" };

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

  const [, typed, flightDigits] = match;
  const airlineCode = AIRLINE_ALIASES[typed] ?? typed;
  const airline = airlineProfiles.find((a) => a.code === airlineCode);
  return {
    airlineCode,
    flightDigits,
    normalized: `${airlineCode} ${flightDigits}`,
    airlineName: airline?.name ?? airlineCode,
  };
}
