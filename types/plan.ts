import type { FlightInfo } from "@/types/flight";
import type { WeatherBrief } from "@/types/weather";

export interface Perks {
  precheck: boolean;
  clear: boolean;
  globalEntry: boolean;
  touchlessId: boolean;
}

export interface OriginInput {
  /** Free text: address, zip, neighborhood. */
  text?: string;
  /** Coordinates, e.g. from "use my current location" or a picked suggestion. */
  lat?: number;
  lon?: number;
  label?: string;
}

/** The departure the traveler confirmed: we plan exactly this airport and time, never another leg. */
export interface LegChoice {
  /** IATA airport code, e.g. SFO. */
  airport: string;
  /** Local departure time HH:mm. */
  time: string;
  destination?: string | null;
  /** schedule: picked from the flight's schedule. traveler: typed in by hand. */
  confirmed: "schedule" | "traveler";
}

export interface ManualFlight {
  /** IATA airport code, e.g. JFK. */
  airport: string;
  /** Local departure time HH:mm. */
  departureTime: string;
}

export type Mode = "ride" | "drive" | "transit";

export interface PlanRequest {
  flightNumber: string;
  /** How they're getting to the airport. Defaults to ride (Uber/Lyft/taxi, curb drop-off). */
  mode?: Mode;
  /** YYYY-MM-DD, the local departure date. */
  date: string;
  origin?: OriginInput | null;
  checkedBag: boolean;
  perks: Perks;
  bufferMinutes: number;
  /** The departure the traveler picked or entered. Required to plan. */
  leg?: LegChoice | null;
  /** Older links: airport and time typed in by hand. Read as a leg. */
  manual?: ManualFlight | null;
}

export interface RouteEstimate {
  originLabel: string | null;
  originCoord: { lat: number; lon: number } | null;
  /** Free-flow drive minutes from the routing engine, before traffic. */
  freeFlowMinutes: number | null;
  distanceKm: number | null;
  source: string;
}

export interface Research {
  driveMinutes: number;
  curbToCheckpointMinutes: number;
  securityMinutes: number;
  checkpointToGateMinutes: number;
  boardingLeadMinutes: number;
  bagDropCutoffMinutes: number | null;
  checkpoint: string;
  lane: string;
  /** Short notes shown at the step where they matter. */
  driveNotes: string[];
  securityNotes: string[];
  gateNotes: string[];
  /** System notes only (couldn't verify live, very long drive). Never from the model. */
  headsUp: string[];
  sources: string[];
  confidence: "high" | "medium" | "low";
  /** Which engine produced this. */
  engine: string;
  /** Forecast trouble in the trip window, and the minutes it added to the drive. */
  weather?: WeatherBrief | null;
  /** Live FAA ground stops, delay programs, and departure delays for this flight's airports. */
  airportAlerts?: string[];
}

export interface TimelineStop {
  key: "leave" | "curb" | "checkpoint" | "security" | "gate" | "boarding" | "departure";
  label: string;
  iso: string;
}

export interface PlanResult {
  flight: FlightInfo;
  route: RouteEstimate;
  research: Research;
  mode: Mode;
  checkedBag: boolean;
  bufferMinutes: number;
  /** Leave time with a zero-minute gate buffer. Client: leave = min(anchor - buffer, bagLeave). */
  anchorISO: string;
  /** Latest leave time that still makes the bag-drop cutoff, or null. */
  bagLeaveISO: string | null;
  leaveISO: string;
  timeline: TimelineStop[];
  isLate: boolean;
  generatedAt: string;
}

export type PlanEvent =
  | { type: "flight"; flight: FlightInfo }
  | { type: "flight_notfound"; message: string }
  | { type: "route"; route: RouteEstimate }
  | { type: "search"; query: string }
  | { type: "stage"; stage: "traffic" | "security" | "rules" | "today" | "synthesis" }
  | { type: "note"; text: string }
  | { type: "result"; result: PlanResult }
  | { type: "error"; message: string };
