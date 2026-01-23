import type { TerminalId, AirlineStatusTier } from "@/types/jfk";

// Airline code to full name mapping
export const airlineNames: Record<string, string> = {
  // Terminal 1
  AF: "Air France",
  LH: "Lufthansa",
  KE: "Korean Air",
  TK: "Turkish Airlines",
  OS: "Austrian Airlines",
  SN: "Brussels Airlines",
  LX: "SWISS",
  TP: "TAP Portugal",

  // Terminal 4
  DL: "Delta",
  KL: "KLM",
  VS: "Virgin Atlantic",
  LA: "LATAM",
  AM: "Aeromexico",
  EK: "Emirates",
  EY: "Etihad",
  SQ: "Singapore Airlines",
  KQ: "Kenya Airways",
  CI: "China Airlines",

  // Terminal 5
  B6: "JetBlue",

  // Terminal 7
  EI: "Aer Lingus",
  AC: "Air Canada",
  FI: "Icelandair",
  F9: "Frontier",
  ET: "Ethiopian Airlines",
  LO: "LOT Polish",
  DE: "Condor",
  NH: "ANA",
  SY: "Sun Country",
  Z0: "Norse Atlantic",
  H4: "HiSky",
  KU: "Kuwait Airways",

  // Terminal 8
  AA: "American Airlines",
  BA: "British Airways",
  IB: "Iberia",
  JL: "Japan Airlines",
  QF: "Qantas",
  QR: "Qatar Airways",
  AS: "Alaska Airlines",
  CX: "Cathay Pacific",
  AY: "Finnair",
  HA: "Hawaiian Airlines",
  CZ: "China Southern",
  RJ: "Royal Jordanian",

  // United (EWR - for reference)
  UA: "United Airlines",
};

// Airline code to terminal mapping
export const airlineTerminals: Record<string, TerminalId> = {
  // Terminal 1
  AF: "1",
  LH: "1",
  KE: "1",
  TK: "1",
  OS: "1",
  SN: "1",
  LX: "1",
  TP: "1",

  // Terminal 4
  DL: "4",
  KL: "4",
  VS: "4",
  LA: "4",
  AM: "4",
  EK: "4",
  EY: "4",
  SQ: "4",
  KQ: "4",
  CI: "4",

  // Terminal 5
  B6: "5",

  // Terminal 7
  EI: "7",
  AC: "7",
  FI: "7",
  F9: "7",
  ET: "7",
  LO: "7",
  DE: "7",
  NH: "7",
  SY: "7",
  Z0: "7",
  H4: "7",
  KU: "7",

  // Terminal 8
  AA: "8",
  BA: "8",
  IB: "8",
  JL: "8",
  QF: "8",
  QR: "8",
  AS: "8",
  CX: "8",
  AY: "8",
  HA: "8",
  CZ: "8",
  RJ: "8",
};

// Status tiers by airline
export const airlineStatusTiers: Record<string, AirlineStatusTier> = {
  DL: {
    airline: "Delta",
    tiers: [
      { value: "none", label: "None (General boarding)" },
      { value: "silver", label: "Silver Medallion" },
      { value: "gold", label: "Gold Medallion" },
      { value: "platinum", label: "Platinum Medallion" },
      { value: "diamond", label: "Diamond Medallion" },
      { value: "360", label: "Delta 360" },
      { value: "first", label: "First Class ticket" },
    ],
  },
  AA: {
    airline: "American Airlines",
    tiers: [
      { value: "none", label: "None (General boarding)" },
      { value: "gold", label: "AAdvantage Gold" },
      { value: "platinum", label: "AAdvantage Platinum" },
      { value: "platinum_pro", label: "AAdvantage Platinum Pro" },
      { value: "executive_platinum", label: "AAdvantage Executive Platinum" },
      { value: "concierge_key", label: "Concierge Key" },
      { value: "first", label: "First Class ticket" },
    ],
  },
  B6: {
    airline: "JetBlue",
    tiers: [
      { value: "none", label: "None (General boarding)" },
      { value: "mosaic", label: "Mosaic" },
      { value: "mosaic_2", label: "Mosaic 2" },
      { value: "mosaic_3", label: "Mosaic 3" },
      { value: "mosaic_4", label: "Mosaic 4" },
      { value: "mint", label: "Mint Class ticket" },
    ],
  },
  AS: {
    airline: "Alaska Airlines",
    tiers: [
      { value: "none", label: "None (General boarding)" },
      { value: "mvp", label: "MVP" },
      { value: "mvp_gold", label: "MVP Gold" },
      { value: "mvp_gold_75k", label: "MVP Gold 75K" },
      { value: "first", label: "First Class ticket" },
    ],
  },
  // Default for other airlines
  DEFAULT: {
    airline: "Other",
    tiers: [
      { value: "none", label: "None (General boarding)" },
      { value: "status", label: "Elite status" },
      { value: "premium", label: "Premium cabin ticket" },
      { value: "first", label: "First/Business Class ticket" },
    ],
  },
};

// Get terminal for an airline code
export function getTerminalForAirline(airlineCode: string): TerminalId | null {
  const code = airlineCode.toUpperCase();
  return airlineTerminals[code] || null;
}

// Get airline name from code
export function getAirlineName(airlineCode: string): string {
  const code = airlineCode.toUpperCase();
  return airlineNames[code] || code;
}

// Get status tiers for an airline
export function getStatusTiers(
  airlineCode: string
): { value: string; label: string }[] {
  const code = airlineCode.toUpperCase();
  return (airlineStatusTiers[code] || airlineStatusTiers.DEFAULT).tiers;
}

// Parse flight number to extract airline code and number
export function parseFlightNumber(
  flightNumber: string
): { airlineCode: string; number: string } | null {
  const cleaned = flightNumber.replace(/\s+/g, "").toUpperCase();

  // Try 2-letter code first (e.g., "DL405", "AA1234")
  const match2 = cleaned.match(/^([A-Z]{2})(\d+)$/);
  if (match2) {
    return { airlineCode: match2[1], number: match2[2] };
  }

  // Try 3-letter code (less common, e.g., "DAL405")
  const match3 = cleaned.match(/^([A-Z]{3})(\d+)$/);
  if (match3) {
    // Map 3-letter ICAO codes to 2-letter IATA codes
    const icaoToIata: Record<string, string> = {
      DAL: "DL",
      AAL: "AA",
      JBU: "B6",
      UAL: "UA",
      ASA: "AS",
    };
    const iataCode = icaoToIata[match3[1]];
    if (iataCode) {
      return { airlineCode: iataCode, number: match3[2] };
    }
  }

  return null;
}

// Check if it's a Delta flight (for Touchless ID eligibility)
export function isDeltaFlight(airlineCode: string): boolean {
  return airlineCode.toUpperCase() === "DL";
}

// Check if it's an American flight (for AA Touchless ID)
export function isAmericanFlight(airlineCode: string): boolean {
  return airlineCode.toUpperCase() === "AA";
}
