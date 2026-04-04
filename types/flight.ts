import type { AirportCode, FlightRegion } from "@/types/airport";

export interface FlightInfo {
  flightNumber: string;
  airlineCode: string;
  airlineName: string;
  departureAirport: AirportCode;
  destinationAirportCode?: string;
  destinationCity?: string;
  departureTime: string;
  terminal: string | null;
  gate: string | null;
  status: "scheduled" | "delayed" | "cancelled" | "unknown";
  delayMinutes: number;
  region: FlightRegion;
  source: string;
  notes: string[];
}
