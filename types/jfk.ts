// Terminal IDs
export type TerminalId = "1" | "4" | "5" | "7" | "8";

// Security options
export type SecurityType =
  | "standard"
  | "precheck"
  | "clear"
  | "global_entry"
  | "touchless_id";

// Airline status tiers
export type AirlineStatusTier = {
  airline: string;
  tiers: { value: string; label: string }[];
};

// Terminal information
export interface Terminal {
  id: TerminalId;
  name: string;
  airlines: string[];
  primaryAirline?: string;
  securityOptions: {
    precheck: boolean;
    precheckHours?: { open: string; close: string };
    clear: boolean;
    clearStatus?: "open" | "closed" | "temporarily_closed";
    clearHours?: { open: string; close: string };
    touchlessId: boolean;
    t4Reserve: boolean;
  };
  status: string;
  notes: string[];
  walkTimes: {
    curbToSecurity: { min: number; max: number };
    securityToGates: { min: number; max: number };
    concourseC?: { min: number; max: number }; // For T8
  };
  peakTimes: string[];
  accessNotes?: string[];
  lounges?: string[];
}

// Flight information
export interface FlightInfo {
  flightNumber: string;
  airline: string;
  airlineCode: string;
  origin?: string;
  destination: string;
  departureTime: Date;
  terminal: TerminalId;
  gate?: string;
  status: "on_time" | "delayed" | "cancelled" | "unknown";
  delayMinutes?: number;
  isInternational: boolean;
}

// Security wait time data
export interface SecurityWaitTime {
  terminal: TerminalId;
  standardWait: number; // minutes
  precheckWait?: number;
  clearWait?: number;
  lastUpdated: Date;
  source: string;
  isLiveData: boolean;
}

// Traffic/travel data
export interface TravelTimeInfo {
  durationMinutes: number;
  durationWithTraffic: number;
  routeDescription: string;
  trafficLevel: "light" | "moderate" | "heavy" | "severe";
  incidents?: string[];
  constructionBuffer: number;
}

// Calculation breakdown step
export interface BreakdownStep {
  id: string;
  icon: string;
  label: string;
  minutes: number;
  details?: string;
}

// Full calculation result
export interface CalculationResult {
  leaveByTime: Date;
  boardingTime: Date;
  departureTime: Date;
  totalMinutes: number;
  bufferMinutes: number;
  breakdown: BreakdownStep[];
  warnings: string[];
  proTips: string[];
  isPeakDay: boolean;
  peakDayType?: "extreme" | "high" | "moderate";
  flightInfo: FlightInfo;
}

// User input for calculation
export interface CalculationInput {
  flightNumber: string;
  date: Date;
  origin: string;
  hasPrecheck: boolean;
  hasClear: boolean;
  hasGlobalEntry: boolean;
  hasTouchlessId: boolean;
  checkingBag: boolean;
  airlineStatus: string;
  bufferPreference: number; // 15-60 minutes
}

// Peak day info
export interface PeakDayInfo {
  date: Date;
  type: "extreme" | "high" | "moderate";
  description: string;
  securityMultiplier: number;
}

// Bag check rules
export interface BagCheckRule {
  scenario: string;
  cutoffMinutes: number;
  isInternational: boolean;
  hasCheckedBag: boolean;
}
