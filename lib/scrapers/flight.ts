import { formatISO } from "date-fns";

import { detectAirportTerminalByAirline, getAirlineProfile } from "@/lib/airports";
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
    const departureTime = extractDepartureTime(blob, date);

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
      departureTime: departureTime ?? formatISO(new Date(`${date}T09:00:00`)),
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
      departureTime: formatISO(new Date(`${date}T09:00:00`)),
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

function extractDepartureTime(text: string, date: string): string | null {
  // Try "at HH:MM" (24h format, common in flight tracker snippets)
  const at24Match = text.match(/(?:at|departs?|leaves?|departure)\s+(\d{1,2}):(\d{2})(?:\s*(am|pm))?/i);
  if (at24Match) {
    let hours = parseInt(at24Match[1], 10);
    const minutes = parseInt(at24Match[2], 10);
    const meridian = at24Match[3]?.toLowerCase();
    if (meridian === "pm" && hours < 12) hours += 12;
    if (meridian === "am" && hours === 12) hours = 0;
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return formatISO(new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`));
    }
  }

  // Try standalone "HH:MM am/pm" pattern
  const ampmMatch = text.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)\b/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const meridian = ampmMatch[3].toLowerCase();
    if (meridian === "pm" && hours < 12) hours += 12;
    if (meridian === "am" && hours === 12) hours = 0;
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return formatISO(new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`));
    }
  }

  // Try bold time pattern from search snippets: **07:00** or similar
  const boldTimeMatch = text.match(/\*\*(\d{1,2}):(\d{2})\*\*/);
  if (boldTimeMatch) {
    const hours = parseInt(boldTimeMatch[1], 10);
    const minutes = parseInt(boldTimeMatch[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return formatISO(new Date(`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`));
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
