/**
 * IATA -> ICAO airline mapping so we can build FlightAware idents
 * (FlightAware resolves "DAL405" but not "DL405").
 */
const IATA_TO_ICAO: Record<string, { icao: string; name: string }> = {
  AA: { icao: "AAL", name: "American Airlines" },
  DL: { icao: "DAL", name: "Delta Air Lines" },
  UA: { icao: "UAL", name: "United Airlines" },
  WN: { icao: "SWA", name: "Southwest Airlines" },
  B6: { icao: "JBU", name: "JetBlue" },
  AS: { icao: "ASA", name: "Alaska Airlines" },
  NK: { icao: "NKS", name: "Spirit Airlines" },
  F9: { icao: "FFT", name: "Frontier Airlines" },
  HA: { icao: "HAL", name: "Hawaiian Airlines" },
  G4: { icao: "AAY", name: "Allegiant Air" },
  SY: { icao: "SCX", name: "Sun Country Airlines" },
  MX: { icao: "MXY", name: "Breeze Airways" },
  AC: { icao: "ACA", name: "Air Canada" },
  WS: { icao: "WJA", name: "WestJet" },
  AM: { icao: "AMX", name: "Aeromexico" },
  BA: { icao: "BAW", name: "British Airways" },
  VS: { icao: "VIR", name: "Virgin Atlantic" },
  AF: { icao: "AFR", name: "Air France" },
  KL: { icao: "KLM", name: "KLM" },
  LH: { icao: "DLH", name: "Lufthansa" },
  LX: { icao: "SWR", name: "SWISS" },
  OS: { icao: "AUA", name: "Austrian Airlines" },
  SN: { icao: "BEL", name: "Brussels Airlines" },
  IB: { icao: "IBE", name: "Iberia" },
  TP: { icao: "TAP", name: "TAP Air Portugal" },
  AY: { icao: "FIN", name: "Finnair" },
  EI: { icao: "EIN", name: "Aer Lingus" },
  FI: { icao: "ICE", name: "Icelandair" },
  SK: { icao: "SAS", name: "SAS" },
  LO: { icao: "LOT", name: "LOT Polish Airlines" },
  TK: { icao: "THY", name: "Turkish Airlines" },
  EK: { icao: "UAE", name: "Emirates" },
  EY: { icao: "ETD", name: "Etihad Airways" },
  QR: { icao: "QTR", name: "Qatar Airways" },
  SQ: { icao: "SIA", name: "Singapore Airlines" },
  CX: { icao: "CPA", name: "Cathay Pacific" },
  JL: { icao: "JAL", name: "Japan Airlines" },
  NH: { icao: "ANA", name: "All Nippon Airways" },
  KE: { icao: "KAL", name: "Korean Air" },
  OZ: { icao: "AAR", name: "Asiana Airlines" },
  QF: { icao: "QFA", name: "Qantas" },
  NZ: { icao: "ANZ", name: "Air New Zealand" },
  ET: { icao: "ETH", name: "Ethiopian Airlines" },
  DE: { icao: "CFG", name: "Condor" },
  LA: { icao: "LAN", name: "LATAM Airlines" },
  CM: { icao: "CMP", name: "Copa Airlines" },
  AV: { icao: "AVA", name: "Avianca" },
  TN: { icao: "THT", name: "Air Tahiti Nui" },
  FJ: { icao: "FJI", name: "Fiji Airways" },
  MU: { icao: "CES", name: "China Eastern" },
  CA: { icao: "CCA", name: "Air China" },
  CZ: { icao: "CSN", name: "China Southern" },
  BR: { icao: "EVA", name: "EVA Air" },
  CI: { icao: "CAL", name: "China Airlines" },
  TG: { icao: "THA", name: "Thai Airways" },
  VN: { icao: "HVN", name: "Vietnam Airlines" },
  AI: { icao: "AIC", name: "Air India" },
  SA: { icao: "SAA", name: "South African Airways" },
  MS: { icao: "MSR", name: "EgyptAir" },
  RJ: { icao: "RJA", name: "Royal Jordanian" },
  KU: { icao: "KAC", name: "Kuwait Airways" },
  SV: { icao: "SVA", name: "Saudia" },
};

export function iataToIcaoIdent(airlineIata: string, flightDigits: string): string | null {
  const entry = IATA_TO_ICAO[airlineIata.toUpperCase()];
  return entry ? `${entry.icao}${flightDigits}` : null;
}

export function airlineNameFromIata(airlineIata: string): string | null {
  return IATA_TO_ICAO[airlineIata.toUpperCase()]?.name ?? null;
}
