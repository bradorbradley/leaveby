import type { FlightInfo } from "@/types/flight";
import type { SecurityEstimate } from "@/types/security";
import type { TravelEstimate } from "@/types/traffic";
import type { WeatherEstimate } from "@/types/weather";

import type { TravelMode } from "@/types/forms";

export interface CalculationOptions {
  origin: string;
  mode: TravelMode;
  hasPreCheck: boolean;
  hasClear: boolean;
  hasGlobalEntry: boolean;
  hasTouchlessId: boolean;
  checkedBag: boolean;
  airlineStatus: string;
  mobileBoardingPass?: boolean;
  bufferMinutes: number;
}

export interface BreakdownItem {
  id: string;
  icon: string;
  label: string;
  minutes: number;
  detail: string;
}

export interface CalculationResult {
  leaveByTime: string;
  targetBufferMinutes: number;
  airportArrivalMinutes: number;
  travelMinutes: number;
  totalMinutes: number;
  boardingTime: string;
  departureTime: string;
  flight: FlightInfo;
  traffic: TravelEstimate;
  security: SecurityEstimate;
  weather: WeatherEstimate;
  breakdown: BreakdownItem[];
  warnings: string[];
  proTips: string[];
  peakDayLabel?: string | null;
  dataQuality: "live" | "mixed" | "fallback";
  isLate: boolean;
}
