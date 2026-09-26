import { iataToIcaoIdent } from "@/lib/airline-codes";
import { worldAirport } from "@/lib/airports/world";
import { instantToZonedParts, normalizeTimezone } from "@/lib/tz";

/**
 * One scheduled departure of a flight number. A flight number can fly several of
 * these a day from different airports (IAD → DFW → ORD → SAN), so nothing downstream
 * ever picks one on the traveler's behalf: they choose, and we plan that one.
 */
export interface Leg {
  airport: string;
  airportName: string | null;
  city: string | null;
  timezone: string;
  coord: { lat: number; lon: number } | null;
  destination: string | null;
  destinationCity: string | null;
  /** Local departure date at the origin, YYYY-MM-DD. */
  localDate: string;
  /** Scheduled local departure time at the origin, HH:mm. */
  localTime: string;
  scheduledISO: string;
  estimatedISO: string | null;
  terminal: string | null;
  gate: string | null;
  cancelled: boolean;
  source: "FlightAware" | "FlightStats";
}

export interface Schedule {
  legs: Leg[];
  /** Dates the sources have schedule data for, so "no legs that day" means the flight doesn't fly then. */
  coveredDates: string[];
  /** Sources that answered, and those that didn't (blocked, down, timed out). */
  reached: string[];
  failed: string[];
}

const SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

// Schedule sources throttle a server that asks too often, and every keystroke-driven lookup,
// plan and live-status poll needs the same page. Share one fetch per flight for a few minutes,
// and back off briefly after a failure.
const OK_TTL_MS = 5 * 60_000;
const FAIL_TTL_MS = 30_000;
const cache = new Map<string, { at: number; ok: boolean; value: Promise<unknown> }>();

/** Tests only: forget cached schedules. */
export function clearScheduleCache() {
  cache.clear();
}

function cached<T>(key: string, load: () => Promise<T | null>): Promise<T | null> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < (hit.ok ? OK_TTL_MS : FAIL_TTL_MS)) return hit.value as Promise<T | null>;
  if (cache.size > 500) cache.clear();
  const entry = { at: Date.now(), ok: true, value: Promise.resolve(null) as Promise<unknown> };
  entry.value = load()
    .catch((error) => {
      console.warn(`[schedule] ${key} failed:`, error instanceof Error ? error.message : error);
      return null;
    })
    .then((value) => {
      entry.ok = value !== null;
      entry.at = Date.now();
      return value;
    });
  cache.set(key, entry);
  return entry.value as Promise<T | null>;
}

/** Every leg both schedule sources know for this flight number, merged. */
export async function fetchSchedule(airlineCode: string, flightDigits: string): Promise<Schedule> {
  const [fa, fs] = await Promise.all([
    cached(`fa:${airlineCode}${flightDigits}`, () => loadFlightAware(airlineCode, flightDigits)),
    cached(`fs:${airlineCode}${flightDigits}`, () => loadFlightStats(airlineCode, flightDigits)),
  ]);
  const reached = [fa && "FlightAware", fs && "FlightStats"].filter(Boolean) as string[];
  const failed = [!fa && "FlightAware", !fs && "FlightStats"].filter(Boolean) as string[];
  return {
    legs: mergeLegs(fa?.legs ?? [], fs?.legs ?? []),
    coveredDates: [...new Set([...(fa?.coveredDates ?? []), ...(fs?.coveredDates ?? [])])].sort(),
    reached,
    failed,
  };
}

/** FlightAware legs win (they carry terminal, gate and delays); FlightStats fills in legs FlightAware lacks. */
export function mergeLegs(primary: Leg[], secondary: Leg[]): Leg[] {
  const out = [...primary];
  for (const leg of secondary) {
    const twin = out.some(
      (p) => p.airport === leg.airport && p.localDate === leg.localDate && (!p.destination || !leg.destination || p.destination === leg.destination),
    );
    if (!twin) out.push(leg);
  }
  return out.sort((a, b) => a.scheduledISO.localeCompare(b.scheduledISO));
}

// ---------------------------------------------------------------------------
// FlightAware: the public flight page embeds ~2 weeks of legs as JSON.

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

export interface FlightAwareBootstrap {
  flights?: Record<string, FlightAwareLeg & { activityLog?: { flights?: FlightAwareLeg[] } }>;
}

async function loadFlightAware(airlineCode: string, flightDigits: string) {
  const ident = iataToIcaoIdent(airlineCode, flightDigits) ?? `${airlineCode}${flightDigits}`;
  const response = await fetch(`https://www.flightaware.com/live/flight/${ident}`, {
    headers: { "User-Agent": IPHONE, Accept: "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const blob = html.match(/trackpollBootstrap = (\{[\s\S]*?\});<\/script>/)?.[1];
  if (!blob) throw new Error(`no schedule data in page (${html.length} bytes${/captcha|challenge|access denied/i.test(html) ? ", bot check" : ""})`);
  return parseFlightAware(JSON.parse(blob) as FlightAwareBootstrap);
}

export function parseFlightAware(bootstrap: FlightAwareBootstrap): { legs: Leg[]; coveredDates: string[] } {
  const raw: FlightAwareLeg[] = [];
  for (const flight of Object.values(bootstrap.flights ?? {})) {
    raw.push(flight, ...(flight.activityLog?.flights ?? []));
  }
  const seen = new Set<string>();
  const legs: Leg[] = [];
  for (const leg of raw) {
    const origin = leg.origin;
    const scheduled = leg.gateDepartureTimes?.scheduled;
    if (!origin?.iata || !scheduled) continue;
    const key = `${origin.iata}|${scheduled}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const world = worldAirport(origin.iata);
    const timezone = origin.TZ ? normalizeTimezone(origin.TZ) : world?.timezone;
    if (!timezone) continue;
    const scheduledAt = new Date(scheduled * 1000);
    const estimated = leg.gateDepartureTimes?.estimated ?? leg.gateDepartureTimes?.actual ?? null;
    const local = instantToZonedParts(scheduledAt, timezone);
    legs.push({
      airport: origin.iata,
      airportName: origin.friendlyName ?? world?.name ?? null,
      city: world?.city ?? origin.friendlyLocation ?? null,
      timezone,
      coord: origin.coord ? { lat: origin.coord[1], lon: origin.coord[0] } : world ? { lat: world.lat, lon: world.lon } : null,
      destination: leg.destination?.iata ?? null,
      destinationCity: worldAirport(leg.destination?.iata)?.city ?? leg.destination?.friendlyLocation ?? null,
      localDate: local.isoDate,
      localTime: local.hhmm,
      scheduledISO: scheduledAt.toISOString(),
      estimatedISO: estimated ? new Date(estimated * 1000).toISOString() : null,
      terminal: origin.terminal ?? null,
      gate: origin.gate ?? null,
      cancelled: Boolean(leg.cancelled),
      source: "FlightAware",
    });
  }
  // FlightAware lists every day it has, so each day between its first and last leg is covered.
  const dates = legs.map((l) => l.localDate).sort();
  return { legs, coveredDates: dates.length ? daysBetween(dates[0], dates[dates.length - 1]) : [] };
}

// ---------------------------------------------------------------------------
// FlightStats: the flight tracker page lists every leg for a week around today.

interface FlightStatsDay {
  date1?: string; // "26-Sep"
  year?: string;
  flights?: Array<{
    departureAirport?: { iata?: string; fs?: string; name?: string; city?: string };
    arrivalAirport?: { iata?: string; fs?: string; city?: string };
    departureTime24?: string;
    sortTime?: string;
  }>;
}

export interface FlightStatsTracker {
  otherDays?: FlightStatsDay[];
}

async function loadFlightStats(airlineCode: string, flightDigits: string) {
  const number = flightDigits.replace(/^0+(?=\d)/, "");
  const response = await fetch(`https://www.flightstats.com/v2/flight-tracker/${airlineCode}/${number}`, {
    headers: { "User-Agent": SAFARI, Accept: "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const start = html.indexOf("__NEXT_DATA__ = ");
  if (start < 0) throw new Error(`no schedule data in page (${html.length} bytes)`);
  const json = JSON.parse(leadingJsonObject(html, start + "__NEXT_DATA__ = ".length)) as { props?: { initialState?: { flightTracker?: FlightStatsTracker } } };
  return parseFlightStats(json.props?.initialState?.flightTracker ?? {});
}

/** The JSON object starting at `from`, which is followed by more script, so find where it closes. */
export function leadingJsonObject(text: string, from: number): string {
  let depth = 0;
  let inString = false;
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return text.slice(from, i + 1);
  }
  throw new Error("unterminated JSON");
}

const MONTHS: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };

export function parseFlightStats(tracker: FlightStatsTracker): { legs: Leg[]; coveredDates: string[] } {
  const legs: Leg[] = [];
  for (const day of tracker.otherDays ?? []) {
    const [dd, mon] = (day.date1 ?? "").split("-");
    if (!day.year || !MONTHS[mon] || !/^\d{1,2}$/.test(dd ?? "")) continue;
    const localDate = `${day.year}-${MONTHS[mon]}-${dd.padStart(2, "0")}`;
    for (const f of day.flights ?? []) {
      const code = f.departureAirport?.iata ?? f.departureAirport?.fs;
      const world = worldAirport(code);
      if (!code || !world || !f.sortTime || !/^\d{2}:\d{2}$/.test(f.departureTime24 ?? "")) continue;
      const scheduledAt = new Date(f.sortTime);
      if (Number.isNaN(scheduledAt.getTime())) continue;
      // sortTime is the scheduled departure instant; trust it only if it agrees with the listed local time.
      const local = instantToZonedParts(scheduledAt, world.timezone);
      if (local.isoDate !== localDate || local.hhmm !== f.departureTime24) continue;
      const destination = f.arrivalAirport?.iata ?? f.arrivalAirport?.fs ?? null;
      legs.push({
        airport: code,
        airportName: world.name,
        city: world.city,
        timezone: world.timezone,
        coord: { lat: world.lat, lon: world.lon },
        destination,
        destinationCity: worldAirport(destination)?.city ?? f.arrivalAirport?.city ?? null,
        localDate,
        localTime: local.hhmm,
        scheduledISO: scheduledAt.toISOString(),
        estimatedISO: null,
        terminal: null,
        gate: null,
        cancelled: false,
        source: "FlightStats",
      });
    }
  }
  // The last listed day is often still empty before its schedule loads, so only days between
  // two that have flights count as known.
  const dates = legs.map((l) => l.localDate).sort();
  return { legs, coveredDates: dates.length ? daysBetween(dates[0], dates[dates.length - 1]) : [] };
}

function daysBetween(first: string, last: string): string[] {
  const out: string[] = [];
  const d = new Date(`${first}T12:00:00Z`);
  const end = new Date(`${last}T12:00:00Z`);
  while (d <= end && out.length < 60) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
