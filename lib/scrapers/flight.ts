import { formatISO } from "date-fns";

import { airlineNameFromIata, iataToIcaoIdent } from "@/lib/airline-codes";
import { detectAirportTerminalByAirline, getAirlineProfile, getAirportProfile } from "@/lib/airports";
import { parseFlightNumber } from "@/lib/flight-utils";
import { formatInZone, instantToZonedParts, normalizeTimezone, zonedTimeToUtcISO } from "@/lib/tz";
import type { AirportCode } from "@/types/airport";
import type { FlightInfo } from "@/types/flight";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  Accept: "text/html,application/xhtml+xml",
};

interface FlightAwareEndpoint {
  TZ?: string;
  iata?: string;
  icao?: string;
  friendlyName?: string;
  friendlyLocation?: string;
  coord?: [number, number];
  gate?: string | null;
  terminal?: string | null;
}

interface FlightAwareLeg {
  origin?: FlightAwareEndpoint;
  destination?: FlightAwareEndpoint;
  gateDepartureTimes?: { scheduled?: number | null; estimated?: number | null; actual?: number | null };
  cancelled?: boolean;
}

export async function fetchFlightInfo(
  flightNumber: string,
  date: string,
  _preferredAirport?: AirportCode,
): Promise<FlightInfo> {
  const parsed = parseFlightNumber(flightNumber);
  if (!parsed) {
    throw new Error("We couldn't parse that flight number. Try a format like DL 405.");
  }

  const airlineName =
    getAirlineProfile(parsed.airlineCode)?.name ?? airlineNameFromIata(parsed.airlineCode) ?? parsed.airlineName;

  // Primary: FlightAware's public flight page, which embeds structured schedule
  // data (origin, terminal, gate, timezone-safe epoch times) for ~2 weeks of legs.
  try {
    const flightAware = await fetchFromFlightAware(parsed.airlineCode, parsed.flightDigits, date);
    if (flightAware) {
      return {
        ...flightAware,
        terminal:
          flightAware.terminal ?? detectAirportTerminalByAirline(flightAware.departureAirport, parsed.airlineCode),
        flightNumber: parsed.normalized,
        airlineCode: parsed.airlineCode,
        airlineName,
      };
    }
  } catch {
    // fall through to next source
  }

  // Secondary: flight-status.com lists date-specific scheduled departures.
  try {
    const direct = await fetchFromFlightStatusCom(parsed.airlineCode, parsed.flightDigits, date);
    if (direct) {
      return { ...direct, flightNumber: parsed.normalized, airlineCode: parsed.airlineCode, airlineName };
    }
  } catch {
    // fall through to fallback
  }

  // Last resort: airline hub mapping with an honest note that we're guessing.
  const fallbackAirport = guessAirlineHub(parsed.airlineCode);
  const airport = getAirportProfile(fallbackAirport);
  const departureTime = zonedTimeToUtcISO(date, "09:00", airport.timezone);
  return {
    flightNumber: parsed.normalized,
    airlineCode: parsed.airlineCode,
    airlineName,
    departureAirport: fallbackAirport,
    departureAirportName: airport.name,
    departureTimezone: airport.timezone,
    airportCoord: airport.weatherStation.lat ? { lat: airport.weatherStation.lat, lon: airport.weatherStation.lon } : undefined,
    destinationAirportCode: undefined,
    destinationCity: undefined,
    departureTime,
    departureLocalLabel: formatInZone(new Date(departureTime), airport.timezone),
    terminal: detectAirportTerminalByAirline(fallbackAirport, parsed.airlineCode),
    gate: null,
    status: "unknown",
    delayMinutes: 0,
    region: "domestic",
    source: "Fallback schedule estimate",
    notes: [
      "We couldn't find live schedule data for this flight, so this uses a conservative 9:00am placeholder.",
      "Double-check your departure time on your airline's app.",
    ],
  };
}

async function fetchFromFlightAware(
  airlineIata: string,
  flightDigits: string,
  date: string,
): Promise<Omit<FlightInfo, "flightNumber" | "airlineCode" | "airlineName"> | null> {
  const ident = iataToIcaoIdent(airlineIata, flightDigits) ?? `${airlineIata}${flightDigits}`;
  const response = await fetch(`https://www.flightaware.com/live/flight/${ident}`, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(9000),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const html = await response.text();
  const blobMatch = html.match(/trackpollBootstrap = (\{[\s\S]*?\});<\/script>/);
  if (!blobMatch) return null;

  let bootstrap: { flights?: Record<string, { activityLog?: { flights?: FlightAwareLeg[] } } & FlightAwareLeg> };
  try {
    bootstrap = JSON.parse(blobMatch[1]);
  } catch {
    return null;
  }

  const legs: FlightAwareLeg[] = [];
  for (const flight of Object.values(bootstrap.flights ?? {})) {
    if (flight.origin?.iata && flight.gateDepartureTimes?.scheduled) legs.push(flight);
    for (const leg of flight.activityLog?.flights ?? []) {
      if (leg.origin?.iata && leg.gateDepartureTimes?.scheduled) legs.push(leg);
    }
  }
  if (legs.length === 0) return null;

  // Exact date match: the leg whose scheduled departure falls on the requested
  // date in the origin airport's local timezone.
  for (const leg of legs) {
    const tz = normalizeTimezone(leg.origin?.TZ);
    const scheduled = new Date((leg.gateDepartureTimes?.scheduled ?? 0) * 1000);
    if (instantToZonedParts(scheduled, tz).isoDate === date) {
      return buildFromLeg(leg, { exactDate: true });
    }
  }

  // No leg for that date (likely beyond FlightAware's ~2-day forward window).
  // Flights keep stable schedules, so project the most recent leg's local
  // departure time onto the requested date.
  const reference = legs[0];
  const tz = normalizeTimezone(reference.origin?.TZ);
  const referenceParts = instantToZonedParts(new Date((reference.gateDepartureTimes?.scheduled ?? 0) * 1000), tz);
  const projectedDeparture = zonedTimeToUtcISO(date, referenceParts.hhmm, tz);
  const projected = buildFromLeg(reference, { exactDate: false });
  return {
    ...projected,
    departureTime: projectedDeparture,
    departureLocalLabel: formatInZone(new Date(projectedDeparture), tz),
    status: "scheduled",
    delayMinutes: 0,
    gate: null,
    source: "FlightAware · typical schedule for this flight",
    notes: [
      `This flight normally departs around ${referenceParts.hhmm} local time; we've applied that to your travel date.`,
      "Exact-day schedule data appears closer to departure — re-check the day before you fly.",
    ],
  };
}

function buildFromLeg(
  leg: FlightAwareLeg,
  { exactDate }: { exactDate: boolean },
): Omit<FlightInfo, "flightNumber" | "airlineCode" | "airlineName"> {
  const origin = leg.origin!;
  const tz = normalizeTimezone(origin.TZ);
  const scheduled = (leg.gateDepartureTimes?.scheduled ?? 0) * 1000;
  const estimated = (leg.gateDepartureTimes?.estimated ?? leg.gateDepartureTimes?.scheduled ?? 0) * 1000;
  const best = new Date(Math.max(scheduled, estimated));
  const delayMinutes = Math.max(0, Math.round((estimated - scheduled) / 60000));
  const destinationIcao = leg.destination?.icao ?? "";
  const isDomestic = /^(K|PH|PA|TJ|TI)/.test(destinationIcao);

  return {
    departureAirport: origin.iata as AirportCode,
    departureAirportName: origin.friendlyName,
    departureTimezone: tz,
    airportCoord: origin.coord ? { lat: origin.coord[1], lon: origin.coord[0] } : undefined,
    destinationAirportCode: leg.destination?.iata,
    destinationCity: leg.destination?.friendlyLocation ?? leg.destination?.iata,
    departureTime: formatISO(best),
    departureLocalLabel: formatInZone(best, tz),
    terminal: origin.terminal ?? null,
    gate: origin.gate ?? null,
    status: leg.cancelled ? "cancelled" : delayMinutes > 0 ? "delayed" : "scheduled",
    delayMinutes,
    region: isDomestic ? "domestic" : "international",
    source: exactDate ? "FlightAware · live schedule" : "FlightAware",
    notes: [],
  };
}

async function fetchFromFlightStatusCom(
  airlineIata: string,
  flightDigits: string,
  date: string,
): Promise<Omit<FlightInfo, "flightNumber" | "airlineCode" | "airlineName"> | null> {
  const response = await fetch(`https://flight-status.com/${airlineIata.toLowerCase()}-${flightDigits}`, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const html = await response.text();

  const timeRegex = new RegExp(`${date}T(\\d{2}:\\d{2})`, "g");
  const times: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = timeRegex.exec(html)) !== null) times.push(match[1]);
  const departureHHMM = times[0];
  if (!departureHHMM) return null;

  const airportCodes = html.match(/\(([A-Z]{3})\)/g)?.map((code) => code.slice(1, 4)) ?? [];
  const departureAirport = (airportCodes[0] ?? "JFK") as AirportCode;
  const destination = airportCodes[1];
  const airport = getAirportProfile(departureAirport);
  const departureTime = zonedTimeToUtcISO(date, departureHHMM, airport.timezone);

  return {
    departureAirport,
    departureAirportName: airport.name,
    departureTimezone: airport.timezone,
    airportCoord: airport.weatherStation.lat ? { lat: airport.weatherStation.lat, lon: airport.weatherStation.lon } : undefined,
    destinationAirportCode: destination,
    destinationCity: destination,
    departureTime,
    departureLocalLabel: formatInZone(new Date(departureTime), airport.timezone),
    terminal: detectAirportTerminalByAirline(departureAirport, airlineIata),
    gate: null,
    status: "scheduled",
    delayMinutes: 0,
    region: "domestic",
    source: "flight-status.com schedule",
    notes: [],
  };
}

function guessAirlineHub(airlineIata: string): AirportCode {
  const hubs: Record<string, AirportCode> = {
    DL: "ATL",
    AA: "DFW",
    UA: "ORD",
    WN: "DAL",
    B6: "JFK",
    AS: "SEA",
    NK: "FLL",
    F9: "DEN",
    HA: "HNL",
  };
  return hubs[airlineIata.toUpperCase()] ?? "JFK";
}
