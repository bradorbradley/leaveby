export type AirportCode =
  | "ATL"
  | "AUS"
  | "BNA"
  | "BOS"
  | "CLT"
  | "DCA"
  | "DEN"
  | "DFW"
  | "DTW"
  | "EWR"
  | "FLL"
  | "IAD"
  | "IAH"
  | "JFK"
  | "LAS"
  | "LAX"
  | "LGA"
  | "MCO"
  | "MIA"
  | "MSP"
  | "ORD"
  | "PDX"
  | "PHL"
  | "PHX"
  | "SAN"
  | "SEA"
  | "SFO";

export type SecurityService = "standard" | "precheck" | "clear" | "global-entry" | "touchless-id" | "reserve";

export type FlightRegion = "domestic" | "international";

export interface ServiceWindow {
  opensAt: string;
  closesAt: string;
  note?: string;
}

export interface TerminalSecurityProfile {
  waitEstimate: {
    offPeak: number;
    normal: number;
    peak: number;
    holiday: number;
  };
  services: Partial<Record<SecurityService, boolean>>;
  serviceHours?: Partial<Record<Exclude<SecurityService, "standard">, ServiceWindow>>;
  notes: string[];
}

export interface TerminalProfile {
  id: string;
  name: string;
  airportCode: AirportCode;
  airlines: string[];
  curbToSecurityMinutes: [number, number];
  securityToGateMinutes: [number, number];
  peakWindows: string[];
  notes: string[];
  security: TerminalSecurityProfile;
  accessNotes?: string[];
}

export interface AirportProfile {
  code: AirportCode;
  name: string;
  city: string;
  state: string;
  timezone: string;
  constructionBufferMinutes: {
    baseline: number;
    peak: number;
  };
  standardBoardingBuffer: {
    domestic: number;
    international: number;
  };
  defaultPostSecurityBuffer: number;
  bagCutoffs: {
    checkedDomestic: number;
    checkedInternational: number;
    carryOnDomestic: number;
    carryOnInternational: number;
  };
  terminals: TerminalProfile[];
  alerts: string[];
  weatherStation: {
    lat: number;
    lon: number;
  };
}

export interface PeakTravelWindow {
  level: "extreme" | "high" | "moderate";
  multiplier: number;
  name: string;
  dates: string[];
}

export interface AirlineProfile {
  code: string;
  name: string;
  airportAssignments: Partial<Record<AirportCode, string>>;
  statusTiers: string[];
  alliance?: string;
}
