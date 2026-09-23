import type { FlightInfo } from "@/types/flight";
import type { WeatherEstimate, WeatherKind } from "@/types/weather";

const NWS_HEADERS = {
  "User-Agent": "LeaveBy (departure timing app; https://leaveby.vercel.app)",
  Accept: "application/geo+json",
};

type Impact = WeatherEstimate["impact"];
const RANK: Record<Impact, number> = { none: 0, minor: 1, moderate: 2, severe: 3 };

export interface HourReading {
  startISO: string;
  kind: WeatherKind | null;
  impact: Impact;
  chance: number | null;
  text: string;
}

/**
 * The weather that matters is the trip, not just takeoff: the drive and the
 * curb happen hours earlier. Look at every hour from four hours before
 * departure through departure and keep the worst one.
 */
const WINDOW_BEFORE_MS = 4 * 3600_000;

export async function fetchWeather(flight: FlightInfo): Promise<WeatherEstimate> {
  const coord = flight.airportCoord;
  if (!coord || !coord.lat) return fallbackWeather();
  const dep = new Date(flight.departureTime).getTime();
  const from = dep - WINDOW_BEFORE_MS, to = dep + 30 * 60_000;

  const [nws, alerts] = await Promise.all([nwsHours(coord.lat, coord.lon).catch(() => null), nwsAlerts(coord.lat, coord.lon).catch(() => [])]);
  let hours = nws;
  let source = "National Weather Service";
  if (!hours) {
    hours = await openMeteoHours(coord.lat, coord.lon).catch(() => null);
    source = "Open-Meteo";
  }
  if (!hours) return { ...fallbackWeather(), alerts };
  return summarize(hours, from, to, alerts, source);
}

export function summarize(hours: HourReading[], from: number, to: number, alerts: string[], source: string): WeatherEstimate {
  const inWindow = hours.filter((h) => {
    const t = new Date(h.startISO).getTime();
    return t + 3600_000 > from && t < to;
  });
  const worst = inWindow.reduce<HourReading | null>((best, h) => {
    if (!best) return h;
    if (RANK[h.impact] !== RANK[best.impact]) return RANK[h.impact] > RANK[best.impact] ? h : best;
    return (h.chance ?? 0) > (best.chance ?? 0) ? h : best;
  }, null);

  let impact: Impact = worst?.impact ?? "none";
  let kind: WeatherKind | null = worst && worst.impact !== "none" ? worst.kind : null;
  const warnings = alerts.filter((a) => /warning/i.test(a) && /storm|snow|ice|winter|blizzard|flood|wind|hurricane|tropical|freez|fog/i.test(a));
  if (warnings.length) {
    impact = "severe";
    if (!kind) kind = /snow|winter|blizzard/i.test(warnings[0]) ? "snow" : /ice|freez/i.test(warnings[0]) ? "ice" : /fog/i.test(warnings[0]) ? "fog" : /wind/i.test(warnings[0]) ? "wind" : "storm";
  }
  return {
    summary: worst ? `${worst.text}${worst.chance != null ? ` (${worst.chance}% chance)` : ""} in the hours before departure.` : "No forecast for the trip window.",
    impact,
    notes: alerts.map((a) => `Active NWS alert: ${a}.`),
    source,
    kind,
    peakISO: worst && worst.impact !== "none" ? worst.startISO : null,
    chance: worst && worst.impact !== "none" ? worst.chance : null,
    alerts,
  };
}

/** Plain-words forecast to an impact on the roads. */
export function classifyText(text: string, chance: number | null, windMph: number): { kind: WeatherKind | null; impact: Impact } {
  const p = chance ?? 60;
  if (/thunder|t-storm/i.test(text)) return { kind: "storm", impact: p >= 30 ? "severe" : "moderate" };
  if (/freezing|sleet|ice/i.test(text)) return { kind: "ice", impact: p >= 30 ? "severe" : "moderate" };
  if (/snow|blizzard|flurr/i.test(text)) return { kind: "snow", impact: /flurr/i.test(text) || p < 40 ? "moderate" : "severe" };
  if (/heavy rain/i.test(text)) return { kind: "heavy-rain", impact: "moderate" };
  if (/rain|shower|drizzle/i.test(text)) {
    if (p >= 70) return { kind: "rain", impact: "moderate" };
    if (p >= 30) return { kind: "rain", impact: "minor" };
    return { kind: null, impact: "none" };
  }
  if (/fog|smoke|haze/i.test(text)) return { kind: "fog", impact: /dense/i.test(text) ? "moderate" : "minor" };
  if (windMph >= 35) return { kind: "wind", impact: "moderate" };
  if (windMph >= 25) return { kind: "wind", impact: "minor" };
  return { kind: null, impact: "none" };
}

async function nwsHours(lat: number, lon: number): Promise<HourReading[] | null> {
  const points = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`, { headers: NWS_HEADERS, signal: AbortSignal.timeout(6000), cache: "no-store" });
  if (!points.ok) return null;
  const url = ((await points.json()) as { properties?: { forecastHourly?: string } }).properties?.forecastHourly;
  if (!url) return null;
  const res = await fetch(url, { headers: NWS_HEADERS, signal: AbortSignal.timeout(6000), cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    properties?: { periods?: Array<{ startTime: string; shortForecast: string; windSpeed: string; probabilityOfPrecipitation?: { value: number | null } }> };
  };
  const periods = json.properties?.periods ?? [];
  if (!periods.length) return null;
  return periods.map((p) => {
    const chance = p.probabilityOfPrecipitation?.value ?? null;
    const wind = Math.max(0, ...(p.windSpeed.match(/\d+/g)?.map(Number) ?? [0]));
    const c = classifyText(p.shortForecast, chance, wind);
    return { startISO: new Date(p.startTime).toISOString(), kind: c.kind, impact: c.impact, chance, text: p.shortForecast };
  });
}

async function nwsAlerts(lat: number, lon: number): Promise<string[]> {
  const res = await fetch(`https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`, { headers: NWS_HEADERS, signal: AbortSignal.timeout(6000), cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as { features?: Array<{ properties?: { event?: string } }> };
  const events = (json.features ?? []).map((f) => f.properties?.event).filter((e): e is string => Boolean(e));
  return Array.from(new Set(events)).slice(0, 3);
}

/** WMO weather codes (Open-Meteo) to plain words. */
function wmoText(code: number): string {
  if (code >= 95) return "Thunderstorms";
  if (code === 66 || code === 67 || code === 56 || code === 57) return "Freezing rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "Snow";
  if (code === 65 || code === 82) return "Heavy rain";
  if ((code >= 51 && code <= 63) || code === 80 || code === 81) return "Rain";
  if (code === 45 || code === 48) return "Fog";
  return "Clear";
}

/** Worldwide fallback when the NWS has no coverage (outside the US). */
async function openMeteoHours(lat: number, lon: number): Promise<HourReading[] | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&hourly=weather_code,precipitation_probability,wind_speed_10m&wind_speed_unit=mph&timezone=GMT&forecast_days=8`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000), cache: "no-store" });
  if (!res.ok) return null;
  const j = (await res.json()) as { hourly?: { time: string[]; weather_code: number[]; precipitation_probability: Array<number | null>; wind_speed_10m: number[] } };
  const h = j.hourly;
  if (!h?.time?.length) return null;
  return h.time.map((t, i) => {
    const text = wmoText(h.weather_code[i] ?? 0);
    const chance = h.precipitation_probability?.[i] ?? null;
    const c = classifyText(text, chance, h.wind_speed_10m?.[i] ?? 0);
    return { startISO: new Date(`${t}:00Z`).toISOString(), kind: c.kind, impact: c.impact, chance, text };
  });
}

function fallbackWeather(): WeatherEstimate {
  return { summary: "Weather data unavailable.", impact: "none", notes: [], source: "unavailable", kind: null, peakISO: null, chance: null, alerts: [] };
}
