import type { FlightInfo } from "@/types/flight";
import type { WeatherEstimate } from "@/types/weather";

const NWS_HEADERS = {
  "User-Agent": "LeaveBy (departure timing app; contact via github)",
  Accept: "application/geo+json",
};

/** Fetch conditions around departure from the National Weather Service (free, official). */
export async function fetchWeather(flight: FlightInfo): Promise<WeatherEstimate> {
  const coord = flight.airportCoord;
  if (!coord || !coord.lat) {
    return fallbackWeather();
  }

  try {
    const [forecast, alerts] = await Promise.all([
      fetchHourlyForecast(coord.lat, coord.lon, new Date(flight.departureTime)),
      fetchActiveAlerts(coord.lat, coord.lon),
    ]);

    const notes: string[] = [];
    let impact: WeatherEstimate["impact"] = "none";
    let summary = "Conditions look normal.";

    if (forecast) {
      summary = `${forecast.shortForecast}, ${forecast.temperature}°${forecast.temperatureUnit} around departure.`;
      impact = classifyForecast(forecast.shortForecast, forecast.windSpeed);
    }

    for (const alert of alerts) {
      notes.push(alert);
      if (/warning/i.test(alert) && impact !== "severe") impact = "severe";
      else if (impact === "none") impact = "minor";
    }

    return {
      summary,
      impact,
      notes,
      source: "National Weather Service",
    };
  } catch {
    return fallbackWeather();
  }
}

async function fetchHourlyForecast(lat: number, lon: number, departure: Date) {
  const pointsResponse = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`, {
    headers: NWS_HEADERS,
    signal: AbortSignal.timeout(7000),
    cache: "no-store",
  });
  if (!pointsResponse.ok) return null;
  const points = (await pointsResponse.json()) as { properties?: { forecastHourly?: string } };
  const hourlyUrl = points.properties?.forecastHourly;
  if (!hourlyUrl) return null;

  const hourlyResponse = await fetch(hourlyUrl, {
    headers: NWS_HEADERS,
    signal: AbortSignal.timeout(7000),
    cache: "no-store",
  });
  if (!hourlyResponse.ok) return null;
  const hourly = (await hourlyResponse.json()) as {
    properties?: {
      periods?: Array<{
        startTime: string;
        endTime: string;
        shortForecast: string;
        temperature: number;
        temperatureUnit: string;
        windSpeed: string;
      }>;
    };
  };
  const periods = hourly.properties?.periods ?? [];
  if (periods.length === 0) return null;

  const departureMs = departure.getTime();
  return (
    periods.find(
      (period) => new Date(period.startTime).getTime() <= departureMs && departureMs < new Date(period.endTime).getTime(),
    ) ?? periods[periods.length - 1]
  );
}

async function fetchActiveAlerts(lat: number, lon: number): Promise<string[]> {
  try {
    const response = await fetch(
      `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`,
      { headers: NWS_HEADERS, signal: AbortSignal.timeout(7000), cache: "no-store" },
    );
    if (!response.ok) return [];
    const json = (await response.json()) as { features?: Array<{ properties?: { event?: string } }> };
    const events = (json.features ?? [])
      .map((feature) => feature.properties?.event)
      .filter((event): event is string => Boolean(event));
    return Array.from(new Set(events)).slice(0, 3).map((event) => `Active NWS alert: ${event}.`);
  } catch {
    return [];
  }
}

function classifyForecast(shortForecast: string, windSpeed: string): WeatherEstimate["impact"] {
  const wind = Math.max(...(windSpeed.match(/\d+/g)?.map(Number) ?? [0]));
  if (/thunderstorm|snow|ice|sleet|freezing|blizzard/i.test(shortForecast)) return "severe";
  if (/heavy rain|fog|smoke/i.test(shortForecast) || wind >= 30) return "moderate";
  if (/rain|showers|drizzle/i.test(shortForecast) || wind >= 20) return "minor";
  return "none";
}

function fallbackWeather(): WeatherEstimate {
  return {
    summary: "Weather data unavailable. No major airport weather issue assumed.",
    impact: "none",
    notes: ["Fallback weather assumption in use."],
    source: "Fallback weather estimate",
  };
}
