import { computePlan } from "@/lib/plan-math";
import type { FlightInfo } from "@/types/flight";
import type { PlanResult, Research, RouteEstimate } from "@/types/plan";

/**
 * The plan the landing page runs. A real-looking morning at LAX, always a few
 * hours ahead of whoever is looking, so the countdown is alive and every
 * component on the page is the real one with real numbers in it.
 */
export const DEMO_FLIGHT: FlightInfo = {
  flightNumber: "UA 1523",
  airlineCode: "UA",
  airlineName: "United",
  departureAirport: "LAX",
  departureAirportName: "Los Angeles International Airport",
  departureTimezone: "America/Los_Angeles",
  airportCoord: { lat: 33.9416, lon: -118.4085 },
  terminalCoord: { lat: 33.9439, lon: -118.4019 },
  destinationAirportCode: "SFO",
  destinationCity: "San Francisco",
  departureTime: "",
  terminal: "7",
  gate: "73B",
  status: "scheduled",
  delayMinutes: 0,
  region: "domestic",
  source: "demo",
  notes: [],
};

export const DEMO_ROUTE: RouteEstimate = {
  originLabel: "Silver Lake, Los Angeles",
  originCoord: { lat: 34.0869, lon: -118.2702 },
  freeFlowMinutes: 27,
  distanceKm: 26,
  source: "demo",
};

export const DEMO_RESEARCH: Research = {
  driveMinutes: 38,
  curbToCheckpointMinutes: 8,
  securityMinutes: 15,
  checkpointToGateMinutes: 12,
  boardingLeadMinutes: 35,
  bagDropCutoffMinutes: 45,
  checkpoint: "Terminal 7 checkpoint",
  lane: "TSA PreCheck",
  driveNotes: ["Construction on the 405 at Century Blvd: one lane closed until 6 AM. The Sepulveda exit is slow."],
  securityNotes: ["PreCheck lane open from 4:30 AM. About 15 minutes at this hour today."],
  gateNotes: ["Gates 70 to 79 sit at the far end of Terminal 7. The walk is about 12 minutes."],
  headsUp: [],
  sources: ["United flight status", "OSRM routing", "TSA wait times", "LAX traffic advisories"],
  confidence: "high",
  engine: "demo",
};

/** Departure a few hours out, on a clean five-minute mark, in the viewer's own timezone. */
export function demoDeparture(now = Date.now(), hoursAhead = 4) {
  const t = now + hoursAhead * 3_600_000;
  return new Date(Math.ceil(t / 300_000) * 300_000).toISOString();
}

export function demoPlan(opts: { now?: number; bufferMinutes?: number; tz?: string; checkedBag?: boolean } = {}): PlanResult {
  const now = opts.now ?? Date.now();
  const flight: FlightInfo = { ...DEMO_FLIGHT, departureTime: demoDeparture(now), departureTimezone: opts.tz ?? DEMO_FLIGHT.departureTimezone };
  return computePlan({
    flight,
    route: DEMO_ROUTE,
    research: DEMO_RESEARCH,
    bufferMinutes: opts.bufferMinutes ?? 30,
    checkedBag: opts.checkedBag ?? false,
    mode: "ride",
    now: new Date(now),
  });
}
