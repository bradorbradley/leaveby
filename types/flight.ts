import type { AirportCode, FlightRegion } from "@/types/airport";

export interface FlightInfo {
  flightNumber: string;
  airlineCode: string;
  airlineName: string;
  departureAirport: AirportCode;
  departureAirportName?: string;
  departureTimezone?: string;
  airportCoord?: { lat: number; lon: number };
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
