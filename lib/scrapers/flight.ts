import { formatISO } from "date-fns";

import { detectAirportTerminalByAirline, getAirlineProfile, getAirportProfile } from "@/lib/airports";
import { parseFlightNumber } from "@/lib/flight-utils";
import { flattenResultText, searchBrave } from "@/lib/scrapers/brave";
import type { AirportCode } from "@/types/airport";
import type { FlightInfo } from "@/types/flight";

const KNOWN_AIRPORTS = new Set([
  "ATL","AUS","BNA","BOS","CLT","DCA","DEN","DFW","DTW","EWR","FLL",
  "IAD","IAH","JFK","LAS","LAX","LGA","MCO","MIA","MSP","ORD","PDX",
  "PHL","PHX","SAN","SEA","SFO","SLC","TPA","BWI","RDU","HNL","MDW",
  "DAL","ANC","OAK","SMF","SNA","ONT","BUR","ISP","SWF","HPN",
]);

export async function fetchFlightInfo(
  flightNumber: string,
  date: string,
  preferredAirport: AirportCode = "JFK",
): Promise<FlightInfo> {
  const parsed = parseFlightNumber(flightNumber);
  if (!parsed) {
    throw new Error("We couldn't parse that flight number.");
  }

  const airline = getAirlineProfile(parsed.airlineCode);

  // Use a natural language search to get flight details from multiple sources
  const query = `${airline?.name ?? parsed.airlineCode} flight ${parsed.flightDigits} ${date} departure time airport terminal`;

  try {
    const results = await searchBrave(query);
    const blob = flattenResultText(results);

    // Extract route: look for "from AIRPORT (CODE) to AIRPORT (CODE)" pattern
    const routeMatch = blob.match(/from\s+[\w\s]+\(([A-Z]{3})\)\s+(?:\w+\s+)?to\s+[\w\s]+\(([A-Z]{3})\)/i);
    // Also try "CODE to CODE" pattern
    const simpleRouteMatch = blob.match(/\b([A-Z]{3})\s+to\s+([A-Z]{3})\b/);

    let departureAirport: AirportCode = preferredAirport;
    let destinationCode: string | undefined;

    if (routeMatch) {
      const from = routeMatch[1].toUpperCase();
      const to = routeMatch[2].toUpperCase();
      if (KNOWN_AIRPORTS.has(from)) departureAirport = from as AirportCode;
      destinationCode = to;
    } else if (simpleRouteMatch) {
      const from = simpleRouteMatch[1].toUpperCase();
      const to = simpleRouteMatch[2].toUpperCase();
      if (KNOWN_AIRPORTS.has(from)) departureAirport = from as AirportCode;
      if (KNOWN_AIRPORTS.has(to)) destinationCode = to;
    }

    // Extract departure time — try multiple formats
    // Times from search results are in the airport's local timezone
    const airport = getAirportProfile(departureAirport);
    const departureTime = extractDepartureTime(blob, date, airport?.timezone ?? "America/New_York");

    // Extract terminal — be specific to avoid false matches
    const terminal = extractTerminal(blob) ?? detectAirportTerminalByAirline(departureAirport, parsed.airlineCode) ?? null;
    const gate = extractGate(blob);
    const delayMinutes = extractDelay(blob);

    const isInternational = destinationCode
      ? !KNOWN_AIRPORTS.has(destinationCode)
      : false;

    const status = /cancelled|canceled/i.test(blob)
      ? "cancelled"
      : delayMinutes > 0
        ? "delayed"
        : /scheduled|on time/i.test(blob)
          ? "scheduled"
          : "unknown";

    return {
      flightNumber: parsed.normalized,
      airlineCode: parsed.airlineCode,
      airlineName: airline?.name ?? parsed.airlineName,
      departureAirport,
      destinationAirportCode: destinationCode,
      destinationCity: destinationCode,
      departureTime: departureTime ?? localToISO(date, "09:00", airport?.timezone ?? "America/New_York"),
      terminal,
      gate,
      status,
      delayMinutes,
      region: isInternational ? "international" : "domestic",
      source: results[0]?.url ?? "Brave Search",
      notes: results.slice(0, 3).map((r) => r.url),
    };
  } catch {
    return {
      flightNumber: parsed.normalized,
      airlineCode: parsed.airlineCode,
      airlineName: airline?.name ?? parsed.airlineName,
      departureAirport: preferredAirport,
      destinationAirportCode: undefined,
      destinationCity: undefined,
      departureTime: localToISO(date, "09:00", getAirportProfile(preferredAirport)?.timezone ?? "America/New_York"),
      terminal: detectAirportTerminalByAirline(preferredAirport, parsed.airlineCode),
      gate: null,
      status: "unknown",
      delayMinutes: 0,
      region: "domestic",
      source: "Fallback schedule estimate",
      notes: ["Live flight search unavailable. Using airline/airport mapping."],
    };
  }
}

function extractDepartureTime(text: string, date: string, timezone: string): string | null {
  // Try multiple patterns to find a departure time
  const patterns = [
    // "at HH:MM" or "departs HH:MM" with optional am/pm
    /(?:at|departs?|leaves?|departure|scheduled)\s+(\d{1,2}):(\d{2})(?:\s*(am|pm|[A-Z]{2,4}))?/i,
    // Standalone "HH:MM am/pm"
    /\b(\d{1,2}):(\d{2})\s+(am|pm)\b/i,
    // Bold time from snippets: **15:39**
    /\*\*(\d{1,2}):(\d{2})\*\*/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const suffix = match[3]?.toLowerCase();

    // Handle am/pm
    if (suffix === "pm" && hours < 12) hours += 12;
    if (suffix === "am" && hours === 12) hours = 0;

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) continue;

    // The time from search is in the airport's LOCAL timezone.
    // Create an ISO string that reflects this correctly.
    // Use the IANA timezone to get the correct UTC offset.
    const localTimeStr = `${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;

    try {
      // Create a Date by computing the UTC offset for this timezone on this date
      const utcGuess = new Date(localTimeStr + "Z"); // treat as UTC first
      const localAtUtc = new Date(utcGuess.toLocaleString("en-US", { timeZone: timezone }));
      const offsetMs = localAtUtc.getTime() - utcGuess.getTime();
      // The actual UTC time = local time - offset
      const corrected = new Date(utcGuess.getTime() - offsetMs);
      return formatISO(corrected);
    } catch {
      // If timezone conversion fails, fall back to treating as UTC
      return formatISO(new Date(localTimeStr));
    }
  }

  return null;
}

function extractTerminal(text: string): string | null {
  // Match "terminal X" but NOT "terminal and" or "terminal information"
  const match = text.match(/\bterminal\s+(\d{1,2}[A-Z]?)\b/i);
  return match?.[1] ?? null;
}

function extractGate(text: string): string | null {
  const match = text.match(/\bgate\s+([A-Z]\d{1,2}|\d{1,3})\b/i);
  return match?.[1] ?? null;
}

function extractDelay(text: string): number {
  return Number(text.match(/(\d{1,3})\s*(?:-?\s*)?(?:minute|min)\s+delay/i)?.[1] ?? 0);
}

/** Convert a local date + HH:mm to an ISO string accounting for the airport timezone */
function localToISO(date: string, hhmm: string, timezone: string): string {
  const localTimeStr = `${date}T${hhmm}:00`;
  try {
    const utcGuess = new Date(localTimeStr + "Z");
    const localAtUtc = new Date(utcGuess.toLocaleString("en-US", { timeZone: timezone }));
    const offsetMs = localAtUtc.getTime() - utcGuess.getTime();
    return formatISO(new Date(utcGuess.getTime() - offsetMs));
  } catch {
    return formatISO(new Date(localTimeStr));
  }
}
