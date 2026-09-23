import { airlineNameFromIata } from "@/lib/airline-codes";
import { getAirportProfile } from "@/lib/airports";
import { parseFlightNumber } from "@/lib/flight-utils";
import { FAST_MODEL, hasOpenAI, openai } from "@/lib/openai";
import { fetchFlightInfo } from "@/lib/scrapers/flight";
import { formatInZone, zonedTimeToUtcISO } from "@/lib/tz";
import type { FlightInfo } from "@/types/flight";
import type { ManualFlight } from "@/types/plan";

export class FlightNotFoundError extends Error {
  constructor(message = "We couldn't find that flight.") {
    super(message);
    this.name = "FlightNotFoundError";
  }
}

/**
 * Resolve a flight number + date into a FlightInfo.
 * 1. FlightAware / flight-status.com scrape (fast, timezone-correct).
 * 2. OpenAI web search with a strict schema.
 * 3. Throw FlightNotFoundError so the UI can ask for airport + time.
 */
export async function resolveFlight(flightNumber: string, date: string, manual?: ManualFlight | null): Promise<FlightInfo> {
  const parsed = parseFlightNumber(flightNumber);
  if (!parsed) throw new FlightNotFoundError("That doesn't look like a flight number. Try DL 405.");

  if (manual?.airport && manual.departureTime) {
    return buildManualFlight(parsed, date, manual);
  }

  // The schedule scrape is fast but can stall or get rate-limited; try twice.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const scraped = await fetchFlightInfo(parsed.normalized, date);
      if (!scraped.source.startsWith("Fallback")) return scraped;
      console.warn(`[flight] scrape attempt ${attempt} found no schedule for ${parsed.normalized} ${date}`);
    } catch (error) {
      console.warn(`[flight] scrape attempt ${attempt} failed for ${parsed.normalized} ${date}:`, error instanceof Error ? error.message : error);
    }
    if (attempt === 1) await new Promise((r) => setTimeout(r, 400));
  }

  if (hasOpenAI()) {
    try {
      const found = await resolveViaOpenAI(parsed.normalized, date);
      if (found) return found;
      console.warn(`[flight] web search did not find ${parsed.normalized} ${date}`);
    } catch (error) {
      console.warn(`[flight] web search failed for ${parsed.normalized} ${date}:`, error instanceof Error ? error.message : error);
    }
  } else {
    console.warn("[flight] no OPENAI_API_KEY; skipping web search fallback");
  }

  throw new FlightNotFoundError();
}

async function buildManualFlight(
  parsed: NonNullable<ReturnType<typeof parseFlightNumber>>,
  date: string,
  manual: ManualFlight,
): Promise<FlightInfo> {
  const code = manual.airport.trim().toUpperCase();
  const known = getAirportProfile(code);
  let timezone = known.timezone;
  let name = known.name;
  let coord = known.weatherStation.lat ? { lat: known.weatherStation.lat, lon: known.weatherStation.lon } : undefined;

  if ((!coord || name === code) && hasOpenAI()) {
    const meta = await resolveAirportMeta(code);
    if (meta) {
      timezone = meta.timezone;
      name = meta.name;
      coord = { lat: meta.lat, lon: meta.lon };
    }
  }

  const departureTime = zonedTimeToUtcISO(date, manual.departureTime, timezone);
  return {
    flightNumber: parsed.normalized,
    airlineCode: parsed.airlineCode,
    airlineName: airlineNameFromIata(parsed.airlineCode) ?? parsed.airlineName,
    departureAirport: code,
    departureAirportName: name,
    departureTimezone: timezone,
    airportCoord: coord,
    departureTime,
    departureLocalLabel: formatInZone(new Date(departureTime), timezone),
    terminal: null,
    gate: null,
    status: "scheduled",
    delayMinutes: 0,
    region: "domestic",
    source: "Entered by traveler",
    notes: [],
  };
}

interface AirportMeta {
  name: string;
  timezone: string;
  lat: number;
  lon: number;
}

async function resolveAirportMeta(code: string): Promise<AirportMeta | null> {
  try {
    const response = await openai().responses.create({
      model: FAST_MODEL,
      input: `Give the IANA timezone, full name, and coordinates of the airport with IATA code ${code}.`,
      text: {
        format: {
          type: "json_schema",
          name: "airport",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              known: { type: "boolean" },
              name: { type: "string" },
              timezone: { type: "string" },
              lat: { type: "number" },
              lon: { type: "number" },
            },
            required: ["known", "name", "timezone", "lat", "lon"],
          },
        },
      },
    });
    const json = JSON.parse(response.output_text) as AirportMeta & { known: boolean };
    return json.known ? json : null;
  } catch {
    return null;
  }
}

interface OpenAIFlight {
  found: boolean;
  airlineName: string;
  departureAirport: string;
  departureAirportName: string;
  timezone: string;
  airportLat: number;
  airportLon: number;
  terminal: string | null;
  departureLocal: string;
  destinationAirport: string | null;
  destinationCity: string | null;
  international: boolean;
  status: "scheduled" | "delayed" | "cancelled" | "unknown";
}

async function resolveViaOpenAI(flightNumber: string, date: string): Promise<FlightInfo | null> {
  try {
    const response = await openai().responses.create({
      model: FAST_MODEL,
      tools: [{ type: "web_search" }],
      input: `Look up flight ${flightNumber} departing on ${date}. Find the departure airport (IATA code), its IANA timezone and coordinates, the departure terminal if published, the scheduled local departure time on that date, the destination, and whether the route is international. If this flight number does not operate on that date, set found=false. departureLocal must be the local wall-clock time formatted YYYY-MM-DDTHH:mm.`,
      text: {
        format: {
          type: "json_schema",
          name: "flight",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              found: { type: "boolean" },
              airlineName: { type: "string" },
              departureAirport: { type: "string" },
              departureAirportName: { type: "string" },
              timezone: { type: "string" },
              airportLat: { type: "number" },
              airportLon: { type: "number" },
              terminal: { type: ["string", "null"] },
              departureLocal: { type: "string" },
              destinationAirport: { type: ["string", "null"] },
              destinationCity: { type: ["string", "null"] },
              international: { type: "boolean" },
              status: { type: "string", enum: ["scheduled", "delayed", "cancelled", "unknown"] },
            },
            required: [
              "found",
              "airlineName",
              "departureAirport",
              "departureAirportName",
              "timezone",
              "airportLat",
              "airportLon",
              "terminal",
              "departureLocal",
              "destinationAirport",
              "destinationCity",
              "international",
              "status",
            ],
          },
        },
      },
    });
    const json = JSON.parse(response.output_text) as OpenAIFlight;
    if (!json.found || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(json.departureLocal)) return null;
    const parsed = parseFlightNumber(flightNumber)!;
    const [localDate, localTime] = json.departureLocal.split("T");
    const departureTime = zonedTimeToUtcISO(localDate, localTime.slice(0, 5), json.timezone);
    return {
      flightNumber: parsed.normalized,
      airlineCode: parsed.airlineCode,
      airlineName: json.airlineName || parsed.airlineName,
      departureAirport: json.departureAirport.toUpperCase(),
      departureAirportName: json.departureAirportName,
      departureTimezone: json.timezone,
      airportCoord: { lat: json.airportLat, lon: json.airportLon },
      destinationAirportCode: json.destinationAirport ?? undefined,
      destinationCity: json.destinationCity ?? undefined,
      departureTime,
      departureLocalLabel: formatInZone(new Date(departureTime), json.timezone),
      terminal: json.terminal,
      gate: null,
      status: json.status,
      delayMinutes: 0,
      region: json.international ? "international" : "domestic",
      source: "Web search",
      notes: [],
    };
  } catch {
    return null;
  }
}
