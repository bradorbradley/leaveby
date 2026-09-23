import type { FlightInfo } from "@/types/flight";

/**
 * Where a rideshare should actually drop the traveler: the terminal building,
 * not the airport's centroid or weather station (which at JFK lands you at a
 * rental-car lot). Looked up in OpenStreetMap via Nominatim, bounded to the
 * airport, and cached per airport + terminal.
 */
export interface Coord {
  lat: number;
  lon: number;
}

interface NominatimRow {
  lat: string;
  lon: string;
  name?: string;
  category?: string;
  type?: string;
  display_name?: string;
}

const cache = new Map<string, { at: number; value: Coord | null }>();
const TTL_MS = 7 * 24 * 3600_000;
const TIMEOUT_MS = 4500;

function queriesFor(terminal: string): string[] {
  const t = terminal.trim();
  const out = [`Terminal ${t}`];
  if (/^\d+$/.test(t)) out.push(`Terminal ${t} `);
  if (/^[A-Z]$/i.test(t)) out.push(`Concourse ${t.toUpperCase()}`);
  if (/international|intl/i.test(t)) out.push("International Terminal");
  if (/domestic/i.test(t)) out.push("Domestic Terminal");
  if (/main/i.test(t)) out.push("Main Terminal");
  return Array.from(new Set(out.map((s) => s.trim())));
}

function rank(row: NominatimRow, terminal: string): number {
  const name = (row.name ?? "").toLowerCase();
  const want = terminal.trim().toLowerCase();
  const exact = name === `terminal ${want}` || name.endsWith(` terminal ${want}`) || name === want;
  let score = 0;
  if (row.category === "aeroway" && row.type === "terminal") score += 100;
  else if (row.category === "building") score += 60;
  else if (row.category === "railway" || row.type === "bus_stop") score += 30; // AirTrain stop at that terminal: still the right building
  else score -= 50;
  if (exact) score += 20;
  else if (name.includes(`terminal ${want}`)) score += 10;
  return score;
}

async function nominatim(q: string, around: Coord): Promise<NominatimRow[]> {
  const viewbox = `${around.lon - 0.04},${around.lat + 0.03},${around.lon + 0.04},${around.lat - 0.03}`;
  const params = new URLSearchParams({ format: "jsonv2", q, viewbox, bounded: "1", limit: "8" });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { "User-Agent": "LeaveBy/1.0 (https://leaveby.vercel.app)", Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    return (await res.json()) as NominatimRow[];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveTerminalCoord(flight: Pick<FlightInfo, "departureAirport" | "terminal" | "airportCoord">): Promise<Coord | null> {
  const terminal = flight.terminal?.trim();
  const around = flight.airportCoord;
  if (!around) return null;
  const key = `${flight.departureAirport}|${(terminal ?? "").toUpperCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  // No terminal on the flight: fine when the airport has exactly one terminal building.
  if (!terminal) {
    const rows = (await nominatim("Terminal", around)).filter((r) => r.category === "aeroway" && r.type === "terminal");
    const distinct = new Map<string, NominatimRow>();
    for (const r of rows) distinct.set(`${Number(r.lat).toFixed(3)},${Number(r.lon).toFixed(3)}`, r);
    const only = distinct.size === 1 ? Array.from(distinct.values())[0] : null;
    const value = only ? { lat: Number(only.lat), lon: Number(only.lon) } : null;
    cache.set(key, { at: Date.now(), value });
    return value;
  }

  let best: { row: NominatimRow; score: number } | null = null;
  for (const q of queriesFor(terminal)) {
    const rows = await nominatim(q, around);
    for (const row of rows) {
      const score = rank(row, terminal);
      if (score < 30) continue;
      if (!best || score > best.score) best = { row, score };
    }
    if (best && best.score >= 100) break;
  }
  const value = best ? { lat: Number(best.row.lat), lon: Number(best.row.lon) } : null;
  if (value && (!Number.isFinite(value.lat) || !Number.isFinite(value.lon))) return null;
  cache.set(key, { at: Date.now(), value });
  if (!value) console.warn(`[terminal] no building found for ${key}`);
  return value;
}
