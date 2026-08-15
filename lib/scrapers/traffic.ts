import { geocodeOrigin } from "@/lib/geo";
import { getAirportProfile, getTerminalProfile } from "@/lib/airports";
import { instantToZonedParts } from "@/lib/tz";
import type { AirportCode } from "@/types/airport";
import type { FlightInfo } from "@/types/flight";
import type { TravelMode } from "@/types/forms";
import type { TravelEstimate } from "@/types/traffic";

/**
 * Estimate door-to-curb travel time without paid APIs:
 * free geocoding (zippopotam/Photon) + OSRM's public router for base drive
 * time, then a time-of-day traffic model and airport construction buffer.
 */
export async function fetchTravelTime(
  origin: string,
  flight: FlightInfo,
  mode: TravelMode,
): Promise<TravelEstimate> {
  const airportCode = flight.departureAirport as AirportCode;
  const airport = getAirportProfile(airportCode, {
    name: flight.departureAirportName,
    timezone: flight.departureTimezone,
    coord: flight.airportCoord,
  });
  const terminal = getTerminalProfile(airportCode, flight.terminal);
  const timezone = flight.departureTimezone ?? airport.timezone;

  // Traffic conditions are judged at roughly the time the user will be on the
  // road: a couple hours before scheduled departure.
  const onRoadAt = new Date(new Date(flight.departureTime).getTime() - 2.5 * 3600 * 1000);
  const road = instantToZonedParts(onRoadAt, timezone);
  const trafficFactor = timeOfDayTrafficFactor(road.hour, road.weekday);
  const isPeakRoad = trafficFactor >= 1.3;
  const constructionBufferMinutes = isPeakRoad
    ? airport.constructionBufferMinutes.peak
    : airport.constructionBufferMinutes.baseline;

  const airportCoord = flight.airportCoord ??
    (airport.weatherStation.lat ? { lat: airport.weatherStation.lat, lon: airport.weatherStation.lon } : null);
  const routeLabel = `${airport.code}${terminal ? ` ${terminal.name}` : ""}`;

  const geocoded = origin && airportCoord ? await geocodeOrigin(origin, airportCoord) : null;

  if (geocoded && airportCoord) {
    const baseDriveMinutes = await fetchOsrmDriveMinutes(geocoded, airportCoord);
    if (baseDriveMinutes !== null) {
      const driveWithTraffic = Math.round(baseDriveMinutes * trafficFactor);
      const { durationMinutes, modeSummary } = applyMode(mode, driveWithTraffic);
      return {
        durationMinutes: durationMinutes + constructionBufferMinutes,
        mode,
        routeSummary: `${geocoded.label} to ${routeLabel}`,
        trafficSummary: `${describeTraffic(trafficFactor, road.hour)} ${modeSummary}`.trim(),
        incidents: isPeakRoad ? airport.alerts : [],
        constructionBufferMinutes,
        source: "OSRM route + time-of-day traffic model",
      };
    }
  }

  // No usable origin: fall back to a metro-radius heuristic so the answer is
  // still useful, and say so plainly.
  const fallbackBase = 45;
  const { durationMinutes, modeSummary } = applyMode(mode, Math.round(fallbackBase * trafficFactor));
  return {
    durationMinutes: durationMinutes + constructionBufferMinutes,
    mode,
    routeSummary: `${origin ? origin : "Your area"} to ${routeLabel}`,
    trafficSummary: `${origin ? "We couldn't pinpoint that spot, so this assumes a typical metro-area trip." : "Add a ZIP code for a precise drive time — this assumes a typical metro-area trip."} ${modeSummary}`.trim(),
    incidents: [],
    constructionBufferMinutes,
    source: "Fallback metro heuristic",
  };
}

export const fetchTrafficTime = fetchTravelTime;

async function fetchOsrmDriveMinutes(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
): Promise<number | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false&alternatives=false`;
    const response = await fetch(url, { signal: AbortSignal.timeout(7000), cache: "no-store" });
    if (!response.ok) return null;
    const json = (await response.json()) as { routes?: Array<{ duration: number }> };
    const seconds = json.routes?.[0]?.duration;
    return typeof seconds === "number" ? Math.max(5, Math.round(seconds / 60)) : null;
  } catch {
    return null;
  }
}

function applyMode(mode: TravelMode, driveMinutes: number) {
  if (mode === "transit") {
    // Public routers don't expose transit for free; scale drive time for
    // stops/transfers and add platform wait.
    return {
      durationMinutes: Math.max(driveMinutes + 20, Math.round(driveMinutes * 1.4) + 15),
      modeSummary: "Transit estimate includes platform waits and transfers — check your line's schedule.",
    };
  }
  if (mode === "rideshare") {
    return {
      durationMinutes: driveMinutes + 5,
      modeSummary: "Includes curb drop-off. Request your ride ~5 minutes before leave time.",
    };
  }
  return {
    durationMinutes: driveMinutes + 12,
    modeSummary: "Includes parking and the walk to the terminal.",
  };
}

function timeOfDayTrafficFactor(hour: number, weekday: string) {
  const isWeekend = weekday === "Sat" || weekday === "Sun";
  if (!isWeekend) {
    if ((hour >= 7 && hour < 10) || (hour >= 15 && hour < 19)) return 1.45;
    if ((hour >= 6 && hour < 7) || (hour >= 10 && hour < 15) || (hour >= 19 && hour < 21)) return 1.2;
    return 1.0;
  }
  if (hour >= 10 && hour < 19) return 1.2;
  return 1.0;
}

function describeTraffic(factor: number, hour: number) {
  if (factor >= 1.4) return "You'll be on the road during rush hour, so we padded the drive.";
  if (factor >= 1.15) return "Moderate traffic expected for your window.";
  if (hour < 6) return "Early departure — roads should be clear.";
  return "Roads should be clear for your window.";
}
