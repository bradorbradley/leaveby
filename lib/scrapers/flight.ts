import { addMinutes, formatISO } from "date-fns";

import { detectAirportTerminalByAirline, getAirlineProfile } from "@/lib/airports";
import { parseFlightNumber } from "@/lib/flight-utils";
import { flattenResultText, searchBrave } from "@/lib/scrapers/brave";
import type { AirportCode } from "@/types/airport";
import type { FlightInfo } from "@/types/flight";

export async function fetchFlightInfo(
  flightNumber: string,
  date: string,
  preferredAirport: AirportCode = "JFK",
): Promise<FlightInfo> {
  const parsed = parseFlightNumber(flightNumber);
  if (!parsed) {
    throw new Error("We couldn't parse that flight number.");
  }

  const query = `${parsed.normalized} ${date} departure terminal gate site:flightaware.com OR site:google.com OR site:${parsed.airlineCode.toLowerCase()}.com`;
  const airline = getAirlineProfile(parsed.airlineCode);

  try {
    const results = await searchBrave(query);
    const blob = flattenResultText(results);
    const terminal = extractTerminal(blob) ?? detectAirportTerminalByAirline(preferredAirport, parsed.airlineCode) ?? null;
    const gate = extractGate(blob);
    const delayMinutes = extractDelay(blob);
    const destinationAirportCode = extractAirport(blob, preferredAirport);
    const departureTime = extractDateTime(blob, date);
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
      departureAirport: preferredAirport,
      destinationAirportCode,
      destinationCity: destinationAirportCode,
      departureTime: departureTime ?? formatISO(addMinutes(new Date(`${date}T09:00:00`), 0)),
      terminal,
      gate,
      status,
      delayMinutes,
      region: destinationAirportCode && !["JFK", "LGA", "EWR", "ATL", "ORD", "LAX", "DFW", "DEN", "SEA", "SFO", "MIA", "BOS", "CLT", "PHX", "PHL", "LAS", "DCA", "DTW", "MSP", "SAN", "AUS", "BNA", "MCO", "FLL", "PDX", "IAH", "IAD"].includes(destinationAirportCode)
        ? "international"
        : "domestic",
      source: results[0]?.url ?? "Brave Search",
      notes: results.slice(0, 3).map((result) => result.url),
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

function extractTerminal(text: string) {
  return text.match(/\bterminal\s+([A-Z0-9]+)/i)?.[1] ?? null;
}

function extractGate(text: string) {
  return text.match(/\bgate\s+([A-Z]\d{1,2}|\d{1,3})/i)?.[1] ?? null;
}

function extractDelay(text: string) {
  return Number(text.match(/(\d{1,3})\s*(minute|min)\s+delay/i)?.[1] ?? 0);
}

function extractAirport(text: string, fallback: AirportCode): AirportCode | undefined {
  return (text.match(/\b(ATL|AUS|BNA|BOS|CLT|DCA|DEN|DFW|DTW|EWR|FLL|IAD|IAH|JFK|LAS|LAX|LGA|MCO|MIA|MSP|ORD|PDX|PHL|PHX|SAN|SEA|SFO)\b/i)?.[1] ??
    fallback) as AirportCode;
}

function extractDateTime(text: string, date: string) {
  const timeMatch = text.match(/\b(\d{1,2}:\d{2})\s*(am|pm)\b/i);
  if (!timeMatch) return null;
  const [, time, meridian] = timeMatch;
  const [hours, minutes] = time.split(":").map(Number);
  const normalizedHours = meridian.toLowerCase() === "pm" && hours < 12 ? hours + 12 : meridian.toLowerCase() === "am" && hours === 12 ? 0 : hours;
  return formatISO(new Date(`${date}T${String(normalizedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`));
}
