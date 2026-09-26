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

export function worldAirport(code: string | null | undefined): WorldAirport | null {
  const key = (code ?? "").trim().toUpperCase();
  const row = /^[A-Z]{3}$/.test(key) ? table[key] : undefined;
  if (!row) return null;
  const [name, city, country, timezone, lat, lon] = row;
  return { code: key, name, city, country, timezone, lat, lon };
}
