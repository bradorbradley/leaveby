import world from "@/lib/airports/world.json";

/**
 * Every airport with an IATA code: name, city, country, IANA timezone and coordinates.
 * From the mwgg/Airports dataset (MIT licence), trimmed to IATA airports. Server only.
 */
export interface WorldAirport {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  lat: number;
  lon: number;
}

const table = world as unknown as Record<string, [string, string, string, string, number, number]>;

// Codes reassigned after the dataset was taken, mapped to the row they replaced.
// DJT: Palm Beach International became President Donald J. Trump International; IATA PBI → DJT on Aug 18, 2026 (flydjt.org).
const RENAMED: Record<string, string> = { DJT: "PBI" };

export function worldAirport(code: string | null | undefined): WorldAirport | null {
  const key = (code ?? "").trim().toUpperCase();
  const row = /^[A-Z]{3}$/.test(key) ? (table[key] ?? table[RENAMED[key]]) : undefined;
  if (!row) return null;
  const [name, city, country, timezone, lat, lon] = row;
  return { code: key, name, city, country, timezone, lat, lon };
}
