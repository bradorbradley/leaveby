import { geocodeOrigin } from "@/lib/geo";
import type { FlightInfo } from "@/types/flight";
import type { OriginInput, RouteEstimate } from "@/types/plan";

/**
 * Turn the traveler's origin into coordinates + a free-flow drive time to the
 * airport. Free services only: Photon / zippopotam for geocoding, OSRM for
 * routing. Traffic is the research step's job.
 */
export async function estimateRoute(origin: OriginInput | null | undefined, flight: FlightInfo): Promise<RouteEstimate> {
  const airportCoord = flight.airportCoord ?? null;
  const empty: RouteEstimate = { originLabel: null, originCoord: null, freeFlowMinutes: null, distanceKm: null, source: "No origin" };
  if (!origin) return empty;

  let coord: { lat: number; lon: number } | null = null;
  let label: string | null = origin.label ?? origin.text ?? null;

  if (typeof origin.lat === "number" && typeof origin.lon === "number") {
    coord = { lat: origin.lat, lon: origin.lon };
    if (!origin.label) label = (await reverseGeocode(coord)) ?? "Your location";
  } else if (origin.text?.trim()) {
    const geocoded = await geocodeOrigin(origin.text, airportCoord ?? undefined);
    if (geocoded) {
      coord = { lat: geocoded.lat, lon: geocoded.lon };
      label = geocoded.label;
    }
  }

  if (!coord) return { ...empty, originLabel: label, source: "Could not locate origin" };
  if (!airportCoord) return { originLabel: label, originCoord: coord, freeFlowMinutes: null, distanceKm: null, source: "Airport location unknown" };

  const osrm = await fetchOsrm(coord, airportCoord);
  return {
    originLabel: label,
    originCoord: coord,
    freeFlowMinutes: osrm?.minutes ?? null,
    distanceKm: osrm?.km ?? null,
    source: osrm ? "OSRM" : "Routing unavailable",
  };
}

async function fetchOsrm(from: { lat: number; lon: number }, to: { lat: number; lon: number }) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false&alternatives=false`;
    const response = await fetch(url, { signal: AbortSignal.timeout(7000), cache: "no-store" });
    if (!response.ok) return null;
    const json = (await response.json()) as { routes?: Array<{ duration: number; distance: number }> };
    const route = json.routes?.[0];
    if (!route) return null;
    return { minutes: Math.max(5, Math.round(route.duration / 60)), km: Math.round(route.distance / 100) / 10 };
  } catch {
    return null;
  }
}

export async function reverseGeocode(coord: { lat: number; lon: number }): Promise<string | null> {
  try {
    const response = await fetch(`https://photon.komoot.io/reverse?lon=${coord.lon}&lat=${coord.lat}&lang=en`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const json = (await response.json()) as {
      features?: Array<{ properties: { name?: string; street?: string; housenumber?: string; city?: string; district?: string; state?: string } }>;
    };
    const p = json.features?.[0]?.properties;
    if (!p) return null;
    const street = [p.housenumber, p.street].filter(Boolean).join(" ");
    return [street || p.name, p.district ?? p.city ?? p.state].filter(Boolean).join(", ") || null;
  } catch {
    return null;
  }
}

export interface PlaceSuggestion {
  label: string;
  sub: string;
  lat: number;
  lon: number;
}

export async function suggestPlaces(query: string, near?: { lat: number; lon: number }): Promise<PlaceSuggestion[]> {
  const text = query.trim();
  if (text.length < 2) return [];
  try {
    const params = new URLSearchParams({ q: text, limit: "5", lang: "en" });
    if (near) {
      params.set("lat", String(near.lat));
      params.set("lon", String(near.lon));
    }
    const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) return [];
    const json = (await response.json()) as {
      features?: Array<{
        geometry: { coordinates: [number, number] };
        properties: { name?: string; osm_value?: string; street?: string; housenumber?: string; city?: string; district?: string; state?: string; postcode?: string; country?: string; countrycode?: string };
      }>;
    };
    const seen = new Set<string>();
    const out: PlaceSuggestion[] = [];
    for (const f of json.features ?? []) {
      const p = f.properties;
      if (p.countrycode && !["US", "PR"].includes(p.countrycode)) continue;
      const street = [p.housenumber, p.street].filter(Boolean).join(" ");
      const isPlace = Boolean(p.name && (street || p.osm_value === "neighbourhood" || p.osm_value === "postcode"));
      const label = (isPlace ? p.name : street || p.name || p.postcode) ?? "";
      const town = p.district && p.district !== p.city ? p.district : p.city;
      const sub = [isPlace && street ? street : null, town, p.state === town ? null : p.state, p.postcode].filter(Boolean).join(", ");
      const key = `${label}|${sub}`;
      if (!label || seen.has(key)) continue;
      seen.add(key);
      out.push({ label, sub, lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] });
    }
    return out;
  } catch {
    return [];
  }
}
