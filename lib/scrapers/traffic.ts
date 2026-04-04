import { getAirportProfile, getTerminalProfile } from "@/lib/airports";
import { searchBrave } from "@/lib/scrapers/brave";
import type { AirportCode } from "@/types/airport";
import type { TravelEstimate } from "@/types/traffic";

const neighborhoodHints: Record<string, number> = {
  "UPPER WEST SIDE": 55,
  WILLIAMSBURG: 45,
  CHELSEA: 55,
  ASTORIA: 25,
  HOBOKEN: 65,
  "PARK SLOPE": 40,
  "LONG ISLAND CITY": 28,
  "UPPER EAST SIDE": 50,
  BROOKLYN: 45,
  MANHATTAN: 55,
  QUEENS: 30,
};

export async function fetchTravelTime(
  origin: string,
  airportCode: AirportCode,
  terminalId?: string | null,
): Promise<TravelEstimate> {
  const airport = getAirportProfile(airportCode);
  const terminal = getTerminalProfile(airportCode, terminalId);
  const peakNow = isPeakHour(new Date());
  const fallbackBase = getOriginHeuristic(origin);
  const constructionBufferMinutes = peakNow
    ? airport.constructionBufferMinutes.peak
    : airport.constructionBufferMinutes.baseline;

  try {
    const query = `${origin} to ${airport.name} terminal ${terminal?.id ?? ""} current drive time traffic incidents`;
    const results = await searchBrave(query);
    const blob = results.map((result) => `${result.title} ${result.description}`).join(" ");
    const extractedMinutes = Number(blob.match(/(\d{1,3})\s*(minute|min)/i)?.[1] ?? fallbackBase);
    const incidents = results
      .flatMap((result) => [result.description, ...(result.extraSnippets ?? [])])
      .filter((snippet) => /delay|construction|closure|crash|incident|congestion/i.test(snippet))
      .slice(0, 3);

    return {
      durationMinutes: extractedMinutes + constructionBufferMinutes,
      routeSummary: `${origin} to ${airportCode}${terminal ? ` Terminal ${terminal.id}` : ""}`,
      trafficSummary: incidents.length ? "Traffic friction detected on route." : "Current traffic appears manageable.",
      incidents,
      constructionBufferMinutes,
      source: results[0]?.url ?? "Brave Search",
    };
  } catch {
    return {
      durationMinutes: fallbackBase + constructionBufferMinutes,
      routeSummary: `${origin} to ${airportCode}${terminal ? ` Terminal ${terminal.id}` : ""}`,
      trafficSummary: "Using metro-area travel heuristic.",
      incidents: airport.alerts,
      constructionBufferMinutes,
      source: "Fallback metro heuristic",
    };
  }
}

export const fetchTrafficTime = fetchTravelTime;

function getOriginHeuristic(origin: string) {
  const upper = origin.toUpperCase();
  if (/^\d{5}$/.test(origin)) {
    const zipPrefix = Number(origin.slice(0, 3));
    if (zipPrefix >= 100 && zipPrefix <= 102) return 55;
    if (zipPrefix >= 111 && zipPrefix <= 116) return 35;
    if (zipPrefix >= 112 && zipPrefix <= 114) return 45;
  }

  const named = Object.entries(neighborhoodHints).find(([key]) => upper.includes(key));
  return named?.[1] ?? 60;
}

function isPeakHour(date: Date) {
  const hour = date.getHours();
  return (hour >= 5 && hour < 9) || (hour >= 16 && hour < 20);
}
