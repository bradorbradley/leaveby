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

// ─── Brave Search ───────────────────────────────────────────────────────────

interface BraveResult {
  title: string;
  url: string;
  description: string;
  extraSnippets?: string[];
}

async function searchBrave(query: string): Promise<BraveResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return []; // graceful fallback — OpenAI web search will cover

  const params = new URLSearchParams({
    q: query,
    text_decorations: "false",
    result_filter: "web",
    count: "5",
  });

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": apiKey,
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!response.ok) return [];
    const json = await response.json();
    return ((json.web?.results ?? []) as BraveResult[]).map((r) => ({
      title: r.title,
      url: r.url,
      description: r.description,
      extraSnippets: r.extraSnippets ?? [],
    }));
  } catch {
    return []; // Brave failed — OpenAI will handle search as fallback
  }
}

function formatResults(label: string, results: BraveResult[]): string {
  if (results.length === 0) return `[${label}]: No results found. Use your own web search to find this.`;
  return `[${label}]:\n${results
    .map(
      (r, i) =>
        `  ${i + 1}. ${r.title}\n     ${r.url}\n     ${r.description}${r.extraSnippets?.length ? "\n     " + r.extraSnippets.join("\n     ") : ""}`,
    )
    .join("\n")}`;
}

// ─── Airport context helpers ────────────────────────────────────────────────

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

// ─── Main search function ───────────────────────────────────────────────────

export async function searchFlightDetails(input: {
  flightNumber: string;
  date: string;
  airportCode: AirportCode;
  origin: string;
  options: CalculationOptions;
}): Promise<SearchResult> {
  const client = new OpenAI({ timeout: 120000 });

  const parsed = parseFlightNumber(input.flightNumber);
  if (!parsed) throw new Error("We couldn't parse that flight number.");

  const airportContext = buildAirportContext(input.airportCode);
  const airlineContext = buildAirlineContext(parsed.airlineCode);
  const airport = getAirportProfile(input.airportCode);
  const airportName = airport?.name ?? input.airportCode;

  const airlineProfile = getAirlineProfile(parsed.airlineCode);
  const possibleAirports = airlineProfile
    ? Object.keys(airlineProfile.airportAssignments).join(", ")
    : input.airportCode;

  // ── Brave searches: all 4 in parallel ──────────────────────────────────
  const [flightResults1, flightResults2, trafficResults, trafficIncidents, securityResults, weatherResults1, weatherResults2] =
    await Promise.all([
      // Flight: two sources for cross-checking
      searchBrave(`${parsed.airlineName} flight ${parsed.flightDigits} ${input.date} departure time status`),
      searchBrave(`site:flightaware.com ${parsed.airlineCode}${parsed.flightDigits}`),
      // Traffic
      searchBrave(`driving time from ${input.origin} to ${airportName}`),
      searchBrave(`${airportName} traffic delays construction today`),
      // Security
      searchBrave(`${input.airportCode} TSA wait time today ${airport?.terminals?.[0]?.name ?? ""}`),
      // Weather: two sources
      searchBrave(`${airport?.city ?? input.airportCode} airport weather today site:weather.gov`),
      searchBrave(`${input.airportCode} airport weather conditions today`),
    ]);

  const braveData = [
    formatResults("Flight search — general", flightResults1),
    formatResults("Flight search — FlightAware", flightResults2),
    formatResults("Traffic — drive time", trafficResults),
    formatResults("Traffic — incidents & delays", trafficIncidents),
    formatResults("Security — TSA wait times", securityResults),
    formatResults("Weather — weather.gov", weatherResults1),
    formatResults("Weather — general", weatherResults2),
  ].join("\n\n");

  const hasBraveData = [flightResults1, flightResults2, trafficResults, securityResults, weatherResults1, weatherResults2]
    .some((r) => r.length > 0);

  // ── OpenAI: reason about the data ──────────────────────────────────────

  const prompt = `You are a flight departure research assistant. Extract accurate, structured data from the search results below and return JSON. This data determines when someone leaves for the airport — precision matters.

**Flight:** ${parsed.normalized} (${parsed.airlineName})
**Date:** ${input.date}
**Traveler departing from:** ${input.origin}

${airlineContext}
${airportContext}

The airline operates from these airports: ${possibleAirports}.

---

## Search results from Brave (pre-fetched)

${braveData}

---

## Your task

Analyze ALL the search results above and extract:

### 1. Flight info (MOST IMPORTANT)
- Find the departure time for ${parsed.normalized} on ${input.date}
- Cross-check between the general flight search and FlightAware results
- If both sources show a departure time and they disagree by more than 15 minutes, prefer FlightAware
- If the flight is delayed, report the NEW expected time, not the original
- If you can't find the flight in the results above, set status to "unknown" and departureTimeLocal to "09:00" — do NOT guess
- Departure time must be in HH:MM 24-hour format in the airport's LOCAL timezone

### 2. Drive time & traffic
- Extract realistic drive time from "${input.origin}" to the departure airport
- Note any construction, closures, or incidents from the traffic results
- If the origin is a neighborhood name, estimate from its center
- Drive time must be a realistic number (not 0, not 999)

### 3. TSA security wait
- Extract the current standard screening wait time in minutes (NOT PreCheck/CLEAR — we adjust separately)
- If no live data in the results, use the terminal estimates from the airport context above and note it's an estimate

### 4. Weather
- Summarize current conditions at the airport
- Rate impact: "none" (clear/normal), "minor" (light rain, gusty 15-25mph), "moderate" (steady rain, fog, 25-40mph winds), "severe" (thunderstorms, snow, ice, 40+ mph, ground stops)

${!hasBraveData ? `\n**IMPORTANT: Brave Search returned no results. Use your own web search tool to find all of the above data. Search flightaware.com for the flight, Google for drive time, TSA wait times, and weather.gov for weather.**\n` : ""}

---

## Response format

Return ONLY valid JSON. No markdown fences. No explanation. Just the JSON object:
${RESPONSE_SCHEMA}`;

  const response = await client.responses.create({
    model: "gpt-4o",
    // If Brave had gaps, let OpenAI fill them with its own search
    tools: hasBraveData ? [] : [{ type: "web_search_preview" as const }],
    input: prompt,
  });

  // Extract the text output
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

  // ── Map into typed structures ──────────────────────────────────────────

  const resolvedAirport = getAirportProfile(
    (raw.flight.departureAirport as AirportCode) || input.airportCode,
  );
  const tz = resolvedAirport?.timezone ?? "America/New_York";
  const departureAirport =
    (raw.flight.departureAirport as AirportCode) || input.airportCode;

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
    departureTime: localTimeToISO(
      raw.flight.departureTimeLocal,
      input.date,
      tz,
    ),
    terminal:
      raw.flight.terminal ??
      getTerminalProfile(departureAirport, null)?.id ??
      null,
    gate: raw.flight.gate ?? null,
    status: raw.flight.status ?? "unknown",
    delayMinutes: raw.flight.delayMinutes ?? 0,
    region:
      raw.flight.isInternational ||
      (raw.flight.destinationAirport &&
        !KNOWN_US_AIRPORTS.has(raw.flight.destinationAirport))
        ? "international"
        : "domestic",
    source: hasBraveData ? "Brave Search + OpenAI" : "OpenAI web search",
    notes: [],
  };

  const traffic: TravelEstimate = {
    durationMinutes: raw.traffic.estimatedMinutes ?? 60,
    routeSummary:
      raw.traffic.routeSummary ?? `${input.origin} to ${departureAirport}`,
    trafficSummary: raw.traffic.conditions ?? "Traffic conditions unknown.",
    incidents: raw.traffic.incidents ?? [],
    constructionBufferMinutes:
      resolvedAirport?.constructionBufferMinutes.baseline ?? 5,
    source: hasBraveData ? "Brave Search + OpenAI" : "OpenAI web search",
  };

  const security: SecurityEstimate = {
    terminal: flight.terminal,
    airportCode: departureAirport,
    baseWaitMinutes: raw.security.estimatedWaitMinutes ?? 25,
    adjustedWaitMinutes: raw.security.estimatedWaitMinutes ?? 25,
    confidence: hasBraveData ? "live" : "estimated",
    sourceNotes: raw.security.notes ?? [],
    usedSources: hasBraveData
      ? ["Brave Search", "OpenAI"]
      : ["OpenAI web search"],
  };

  const weather: WeatherEstimate = {
    summary: raw.weather.summary ?? "Conditions appear normal.",
    impact: raw.weather.impact ?? "none",
    notes: raw.weather.notes ?? [],
    source: hasBraveData ? "Brave Search + OpenAI" : "OpenAI web search",
  };

  return { flight, traffic, security, weather };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function localTimeToISO(
  hhmm: string,
  date: string,
  timezone: string,
): string {
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
