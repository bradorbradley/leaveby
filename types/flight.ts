import type { AirportCode, FlightRegion } from "@/types/airport";

export interface FlightInfo {
  flightNumber: string;
  airlineCode: string;
  airlineName: string;
  departureAirport: AirportCode;
  departureAirportName?: string;
  departureTimezone?: string;
  airportCoord?: { lat: number; lon: number };
  /** The terminal building itself, for rideshare drop-off. Resolved at plan time. */
  terminalCoord?: { lat: number; lon: number } | null;
  destinationAirportCode?: string;
  destinationCity?: string;
  departureTime: string;
  /** Departure formatted in the airport's local timezone, e.g. "Sun, Aug 16 • 7:00am" */
  departureLocalLabel?: string;
  terminal: string | null;
  gate: string | null;
  status: "scheduled" | "delayed" | "cancelled" | "unknown";
  delayMinutes: number;
  region: FlightRegion;
  source: string;
  notes: string[];
}

/** One departure of a flight number the traveler can pick. */
export interface FlightOption {
  id: string;
  airport: string;
  airportName: string | null;
  city: string | null;
  destination: string | null;
  destinationCity: string | null;
  /** Local departure time at the origin, HH:mm. */
  time: string;
  /** Scheduled departure instant, when the schedule for this date is published. */
  departureISO: string | null;
  terminal: string | null;
  /** True when this is the published schedule for the date; false for the usual time on a later date. */
  exact: boolean;
  departed: boolean;
  cancelled: boolean;
}

export interface FlightOptions {
  flightNumber: string;
  airlineName: string;
  date: string;
  /**
   * exact: departures on this date. typical: the date isn't published yet; usual routes and times.
   * not_operating: schedules cover the date and the flight doesn't fly then. not_found: no such flight.
   * unavailable: schedule sources couldn't be reached.
   */
  status: "exact" | "typical" | "not_operating" | "not_found" | "unavailable";
  options: FlightOption[];
}
