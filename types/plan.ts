import type { FlightInfo } from "@/types/flight";

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
  /** Used when the flight number cannot be resolved. */
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
  /** One sentence: which of the traveler's lanes to use here and why. Empty when the notes don't support one. */
  recommendation: string;
  /** Other ways to get to this terminal from the origin that a local might not know (shuttles, express buses, rail). */
  alternatives: string[];
  /** Trip-level warnings (holiday, weather, events). */
  headsUp: string[];
  sources: string[];
  confidence: "high" | "medium" | "low";
  /** Which engine produced this. */
  engine: string;
}

export interface TimelineStop {
  key: "leave" | "curb" | "security" | "gate" | "boarding" | "departure";
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
  | { type: "stage"; stage: "traffic" | "security" | "rules" | "today" | "options" | "synthesis" }
  | { type: "note"; text: string }
  | { type: "result"; result: PlanResult }
  | { type: "error"; message: string };
