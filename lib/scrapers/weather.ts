import { searchBrave } from "@/lib/scrapers/brave";
import type { AirportCode } from "@/types/airport";
import type { WeatherEstimate } from "@/types/weather";

export async function fetchWeather(airportCode: AirportCode): Promise<WeatherEstimate> {
  try {
    const results = await searchBrave(`${airportCode} airport weather today site:weather.gov`);
    const blob = results.map((result) => `${result.title} ${result.description}`).join(" ");
    const impact = /snow|thunderstorm|fog|ice|severe/i.test(blob)
      ? "moderate"
      : /rain|wind/i.test(blob)
        ? "minor"
        : "none";

    return {
      summary: results[0]?.description ?? "Conditions look normal.",
      impact,
      notes: results.slice(0, 2).map((result) => result.url),
      source: results[0]?.url ?? "Brave Search",
    };
  } catch {
    return {
      summary: "Weather data unavailable. No major airport weather issue assumed.",
      impact: "none",
      notes: ["Fallback weather assumption in use."],
      source: "Fallback weather estimate",
    };
  }
}
