import OpenAI from "openai";

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
  const client = new OpenAI();

  const parsed = parseFlightNumber(input.flightNumber);
  if (!parsed) throw new Error("We couldn't parse that flight number.");

  const airportContext = buildAirportContext(input.airportCode);
  const airlineContext = buildAirlineContext(parsed.airlineCode);

  const airlineProfile = getAirlineProfile(parsed.airlineCode);
  const possibleAirports = airlineProfile
    ? Object.keys(airlineProfile.airportAssignments).join(", ")
    : input.airportCode;

  const prompt = `You are a flight departure research assistant. Your job is to search specific, trusted websites to gather real-time data for a traveler's upcoming flight, then return structured JSON. Be thorough and precise — this data determines when someone leaves for the airport.

**Flight:** ${parsed.normalized} (${parsed.airlineName})
**Date:** ${input.date}
**Traveler departing from:** ${input.origin}

${airlineContext}
${airportContext}

The airline operates from these airports: ${possibleAirports}. Determine which airport this flight actually departs from on ${input.date}.

---

## STEP 1: Flight info (MOST IMPORTANT — get this right)

Search for the flight on these sites IN ORDER. Use the first one that returns data, then cross-check with a second source if possible:

1. **flightaware.com** — search "${parsed.airlineCode}${parsed.flightDigits}" on flightaware.com. This is the most reliable source for real-time departure time, terminal, gate, delay status, and route.
2. **flightstats.com** — search "${parsed.airlineName} ${parsed.flightDigits} ${input.date}". Good for terminal and gate assignments.
3. **google.com** — search "${parsed.airlineName} flight ${parsed.flightDigits} ${input.date} status". Google's flight card often shows departure time, terminal, and delay info directly.

What to extract:
- Scheduled departure time in the airport's LOCAL timezone (e.g., if the flight departs JFK at 3:25 PM Eastern, return "15:25")
- Departure airport code (3-letter IATA)
- Destination airport code
- Terminal and gate (if available)
- Status: is it on time, delayed (by how many minutes), or cancelled?

**Cross-check rule:** If the departure time from source 1 and source 2 disagree by more than 15 minutes, note this in the response and prefer the FlightAware time. If a flight shows as delayed, report the NEW expected departure time, not the original scheduled time.

**If you cannot find the flight at all**, set status to "unknown" and departureTimeLocal to "09:00". Do NOT guess a departure time.

---

## STEP 2: Drive time & traffic

Search for current driving conditions:

1. **google.com** — search "driving time from ${input.origin} to [departure airport name]". Google often shows a travel time estimate directly in search results.
2. **google.com** — search "[departure airport name] traffic delays today" to find any construction, closures, or incidents affecting airport access roads.

What to extract:
- Estimated drive time in minutes (be realistic — include current traffic)
- Brief route description (e.g., "Via I-278 and Belt Parkway")
- Current conditions (light/moderate/heavy traffic)
- Any specific incidents: construction zones, closures, crashes, congestion alerts

**If the origin is vague** (e.g., just a neighborhood name like "Williamsburg" or "Upper West Side"), estimate the drive time to the airport from the center of that area. Don't return 0 or skip this.

---

## STEP 3: TSA security wait times

Search for security line wait times at the specific terminal:

1. **google.com** — search "[airport code] terminal [terminal id] TSA wait time today" (e.g., "JFK terminal 4 TSA wait time today")

What to extract:
- Estimated wait time in MINUTES for standard screening (not PreCheck or CLEAR — we adjust for those separately)
- Any notes about closed lanes, construction, or unusually long lines

**If you can't find live data**, look at the airport context I provided above — it includes typical wait estimates per terminal. Use the "normal" estimate and note that it's an estimate, not live data.

---

## STEP 4: Weather

Search for weather at the departure airport:

1. **weather.gov** — search "[airport city] weather today site:weather.gov". This is the authoritative US weather source.
2. **google.com** — search "[airport code] airport weather" as a backup.

What to extract:
- Brief weather summary (e.g., "Partly cloudy, 65°F, winds 12 mph")
- Impact assessment:
  - "none" = clear/partly cloudy, normal winds, no precipitation
  - "minor" = light rain, gusty winds (15-25 mph), fog expected to clear
  - "moderate" = steady rain, fog, winds 25-40 mph, winter weather advisory
  - "severe" = thunderstorms, heavy snow, ice, winds 40+ mph, FAA ground stop

---

## Response format

Return ONLY valid JSON. No markdown code fences. No explanation text before or after. Just the JSON object.

${RESPONSE_SCHEMA}

## Critical rules
- departureTimeLocal MUST be HH:MM in 24-hour format in the airport's LOCAL timezone
- Do NOT invent or guess flight departure times — only report what you find on flight tracking sites
- estimatedMinutes for traffic must be a realistic number (not 0, not 999)
- If any data point is unavailable, provide your best estimate and explain in the notes field what you couldn't find
- Prefer live/current data over historical averages whenever available`;

  const response = await client.responses.create({
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" }],
    input: prompt,
  });

  // Extract the text output from the response
  const textOutput = response.output.find(
    (block: { type: string }) => block.type === "message",
  );
  if (!textOutput || textOutput.type !== "message") {
    throw new Error("No response from search.");
  }

  const textContent = textOutput.content.find(
    (part: { type: string }) => part.type === "output_text",
  );
  if (!textContent || textContent.type !== "output_text") {
    throw new Error("No text in search response.");
  }

  const raw = JSON.parse(
    textContent.text.replace(/```json?\n?/g, "").replace(/```/g, "").trim(),
  );

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
    adjustedWaitMinutes: raw.security.estimatedWaitMinutes ?? 25,
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
