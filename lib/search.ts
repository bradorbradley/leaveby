import Anthropic from "@anthropic-ai/sdk";

import { getAirlineProfile, getAirportProfile, getTerminalProfile } from "@/lib/airports";
import { airlineProfiles } from "@/lib/airports/data";
import { parseFlightNumber } from "@/lib/flight-utils";
import type { AirportCode } from "@/types/airport";
import type { CalculationOptions } from "@/types/calculation";
import type { FlightInfo } from "@/types/flight";
import type { SecurityEstimate } from "@/types/security";
import type { TravelEstimate } from "@/types/traffic";
import type { WeatherEstimate } from "@/types/weather";

export interface SearchResult {
  flight: FlightInfo;
  traffic: TravelEstimate;
  security: SecurityEstimate;
  weather: WeatherEstimate;
}

const RESPONSE_SCHEMA = `{
  "flight": {
    "departureTimeLocal": "HH:MM (24h, local airport time)",
    "departureAirport": "3-letter IATA code",
    "destinationAirport": "3-letter IATA code or null",
    "terminal": "terminal id or null",
    "gate": "gate id or null",
    "status": "scheduled | delayed | cancelled | unknown",
    "delayMinutes": 0,
    "isInternational": false
  },
  "traffic": {
    "estimatedMinutes": 45,
    "routeSummary": "Brief route description",
    "conditions": "Brief traffic conditions",
    "incidents": ["any notable incidents"]
  },
  "security": {
    "estimatedWaitMinutes": 25,
    "notes": ["relevant notes about security lines"]
  },
  "weather": {
    "summary": "Brief weather description",
    "impact": "none | minor | moderate | severe",
    "notes": ["relevant weather notes"]
  }
}`;

function buildAirportContext(airportCode: AirportCode): string {
  const airport = getAirportProfile(airportCode);
  if (!airport) return "";

  const terminalList = airport.terminals
    .map(
      (t) =>
        `  - ${t.name}: airlines [${t.airlines.join(", ")}], security wait ${t.security.waitEstimate.normal}-${t.security.waitEstimate.peak} min typical`,
    )
    .join("\n");

  return `Airport: ${airport.name} (${airport.code}), ${airport.city}, ${airport.state}
Timezone: ${airport.timezone}
Terminals:\n${terminalList}
${airport.alerts.length ? `Alerts: ${airport.alerts.join("; ")}` : ""}`;
}

function buildAirlineContext(airlineCode: string): string {
  const airline = getAirlineProfile(airlineCode);
  if (!airline) return "";
  const assignments = Object.entries(airline.airportAssignments)
    .map(([code, terminal]) => `${code}→T${terminal}`)
    .join(", ");
  return `Airline: ${airline.name} (${airline.code}), typical terminals: ${assignments}`;
}

export async function searchFlightDetails(input: {
  flightNumber: string;
  date: string;
  airportCode: AirportCode;
  origin: string;
  options: CalculationOptions;
}): Promise<SearchResult> {
  const client = new Anthropic();

  const parsed = parseFlightNumber(input.flightNumber);
  if (!parsed) throw new Error("We couldn't parse that flight number.");

  const airportContext = buildAirportContext(input.airportCode);
  const airlineContext = buildAirlineContext(parsed.airlineCode);

  // Build list of nearby airports the airline operates from
  const airlineProfile = getAirlineProfile(parsed.airlineCode);
  const possibleAirports = airlineProfile
    ? Object.keys(airlineProfile.airportAssignments).join(", ")
    : input.airportCode;

  const prompt = `You are a flight departure research assistant. Search the web to find accurate, real-time information for this trip and return structured JSON.

**Flight:** ${parsed.normalized} (${parsed.airlineName})
**Date:** ${input.date}
**Traveler departing from:** ${input.origin}

${airlineContext}
${airportContext}

The airline operates from these airports: ${possibleAirports}. Determine which airport this flight actually departs from on this date.

## What to search for

1. **Flight info**: Search for "${parsed.airlineName} flight ${parsed.flightDigits} ${input.date}" to find the departure time, terminal, gate, departure airport, destination, and whether it's on time or delayed. Try sources like Google Flights, FlightAware, or flight tracking sites.

2. **Drive time**: Search for current driving time from "${input.origin}" to the departure airport. Look for Google Maps or traffic data. Account for current traffic conditions and any incidents or construction.

3. **TSA security wait**: Search for current TSA wait times at the departure terminal. Try sources like TSA wait times sites or airport-specific security data.

4. **Weather**: Search for current weather at the departure airport. Check if conditions (snow, fog, thunderstorms, heavy rain) could impact airport operations or road travel.

## Response format

Return ONLY valid JSON, no markdown fences, no explanation. Use this exact structure:
${RESPONSE_SCHEMA}

Important:
- departureTimeLocal must be in HH:MM 24-hour format in the airport's local timezone
- estimatedMinutes for traffic should be realistic for the origin/destination pair
- If you cannot find specific data, use your best estimate and note that in the relevant notes field
- Do NOT make up flight times — if you can't find the flight, set status to "unknown" and departureTimeLocal to "09:00"`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5,
      },
    ],
    messages: [{ role: "user", content: prompt }],
  });

  // Extract the text response (after any tool use blocks)
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No response from search.");
  }

  const raw = JSON.parse(textBlock.text.replace(/```json?\n?/g, "").replace(/```/g, "").trim());

  // Map raw response into our typed structures
  const airport = getAirportProfile(
    (raw.flight.departureAirport as AirportCode) || input.airportCode,
  );
  const tz = airport?.timezone ?? "America/New_York";
  const departureAirport = (raw.flight.departureAirport as AirportCode) || input.airportCode;

  const KNOWN_US_AIRPORTS = new Set(
    airlineProfiles.flatMap((a) => Object.keys(a.airportAssignments)),
  );

  const flight: FlightInfo = {
    flightNumber: parsed.normalized,
    airlineCode: parsed.airlineCode,
    airlineName: parsed.airlineName,
    departureAirport,
    destinationAirportCode: raw.flight.destinationAirport ?? undefined,
    destinationCity: raw.flight.destinationAirport ?? undefined,
    departureTime: localTimeToISO(raw.flight.departureTimeLocal, input.date, tz),
    terminal:
      raw.flight.terminal ??
      getTerminalProfile(departureAirport, null)?.id ??
      null,
    gate: raw.flight.gate ?? null,
    status: raw.flight.status ?? "unknown",
    delayMinutes: raw.flight.delayMinutes ?? 0,
    region:
      raw.flight.isInternational ||
      (raw.flight.destinationAirport && !KNOWN_US_AIRPORTS.has(raw.flight.destinationAirport))
        ? "international"
        : "domestic",
    source: "Web search",
    notes: [],
  };

  const traffic: TravelEstimate = {
    durationMinutes: raw.traffic.estimatedMinutes ?? 60,
    routeSummary: raw.traffic.routeSummary ?? `${input.origin} to ${departureAirport}`,
    trafficSummary: raw.traffic.conditions ?? "Traffic conditions unknown.",
    incidents: raw.traffic.incidents ?? [],
    constructionBufferMinutes: airport?.constructionBufferMinutes.baseline ?? 5,
    source: "Web search",
  };

  const security: SecurityEstimate = {
    terminal: flight.terminal,
    airportCode: departureAirport,
    baseWaitMinutes: raw.security.estimatedWaitMinutes ?? 25,
    adjustedWaitMinutes: raw.security.estimatedWaitMinutes ?? 25, // calculator will re-adjust based on PreCheck/CLEAR
    confidence: "live",
    sourceNotes: raw.security.notes ?? [],
    usedSources: ["Web search"],
  };

  const weather: WeatherEstimate = {
    summary: raw.weather.summary ?? "Conditions appear normal.",
    impact: raw.weather.impact ?? "none",
    notes: raw.weather.notes ?? [],
    source: "Web search",
  };

  return { flight, traffic, security, weather };
}

function localTimeToISO(hhmm: string, date: string, timezone: string): string {
  const [hours, minutes] = (hhmm ?? "09:00").split(":").map(Number);
  const localTimeStr = `${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;

  try {
    const utcGuess = new Date(localTimeStr + "Z");
    const localAtUtc = new Date(
      utcGuess.toLocaleString("en-US", { timeZone: timezone }),
    );
    const offsetMs = localAtUtc.getTime() - utcGuess.getTime();
    return new Date(utcGuess.getTime() - offsetMs).toISOString();
  } catch {
    return new Date(localTimeStr).toISOString();
  }
}
