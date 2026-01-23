import type { Terminal, TerminalId } from "@/types/jfk";

export const terminals: Record<TerminalId, Terminal> = {
  "1": {
    id: "1",
    name: "Terminal 1",
    airlines: [
      "Air France",
      "Lufthansa",
      "Korean Air",
      "Turkish Airlines",
      "Austrian",
      "Brussels Airlines",
      "SWISS",
      "TAP Portugal",
    ],
    securityOptions: {
      precheck: true,
      precheckHours: { open: "04:00", close: "20:00" },
      clear: false,
      touchlessId: false,
      t4Reserve: false,
    },
    status: "Under major renovation (New Terminal One project through 2030)",
    notes: [
      "First phase opening 2026",
      "Currently 11 gates",
      "Primarily international carriers",
    ],
    walkTimes: {
      curbToSecurity: { min: 5, max: 7 },
      securityToGates: { min: 5, max: 10 },
    },
    peakTimes: [
      "Early morning international departures (5-8am)",
      "Evening Europe departures",
    ],
  },

  "4": {
    id: "4",
    name: "Terminal 4 (Delta Hub)",
    airlines: [
      "Delta",
      "KLM",
      "Virgin Atlantic",
      "LATAM",
      "Aeromexico",
      "Emirates",
      "Etihad",
      "Singapore Airlines",
      "Kenya Airways",
      "China Airlines",
    ],
    primaryAirline: "Delta",
    securityOptions: {
      precheck: true,
      precheckHours: { open: "04:00", close: "20:00" },
      clear: true,
      clearStatus: "open",
      clearHours: { open: "04:30", close: "22:00" },
      touchlessId: true,
      t4Reserve: true,
    },
    status: "Largest terminal, recently expanded, modern",
    notes: [
      "Multiple security checkpoints",
      "Departures level has CLEAR",
      "Arrivals level is often shorter but no CLEAR",
      "Delta consolidated all operations here from T2 in 2023",
      "T4 RESERVE - FREE reservation system to book security time slot",
    ],
    walkTimes: {
      curbToSecurity: { min: 7, max: 10 },
      securityToGates: { min: 5, max: 15 },
    },
    peakTimes: ["5-8am", "4-7pm"],
    accessNotes: [
      "Now accessed ONLY via Van Wyck Expressway",
      "Rideshare pickup: Remote lot with shuttle (12pm-2am daily)",
    ],
  },

  "5": {
    id: "5",
    name: "Terminal 5 (JetBlue)",
    airlines: ["JetBlue"],
    primaryAirline: "JetBlue",
    securityOptions: {
      precheck: true,
      precheckHours: { open: "06:00", close: "19:30" },
      clear: false,
      touchlessId: false,
      t4Reserve: false,
    },
    status: "Modern (2008), connected to TWA Hotel. $100M renovation announced 2025",
    notes: [
      "29 gates",
      'Known as "hyper-efficient" and user-friendly',
      "Generally efficient security",
    ],
    walkTimes: {
      curbToSecurity: { min: 5, max: 5 },
      securityToGates: { min: 5, max: 10 },
    },
    peakTimes: ["Morning East Coast departures"],
    accessNotes: [
      "New permanent roadway pattern (Oct 2025)",
      "Must follow updated Van Wyck signs",
    ],
  },

  "7": {
    id: "7",
    name: "Terminal 7",
    airlines: [
      "Aer Lingus",
      "Air Canada",
      "Icelandair",
      "Frontier",
      "Ethiopian",
      "LOT Polish",
      "Condor",
      "ANA",
      "Sun Country",
      "Norse Atlantic",
      "HiSky",
      "Kuwait Airways",
    ],
    securityOptions: {
      precheck: true,
      precheckHours: { open: "04:00", close: "19:00" },
      clear: false,
      clearStatus: "temporarily_closed",
      touchlessId: false,
      t4Reserve: false,
    },
    status:
      "Smallest/oldest terminal. Being replaced by new Terminal 6 (opening 2026). Will be demolished after T6 Phase 1 complete.",
    notes: [
      "12 gates",
      "Compact - all gates 1-2 min from security (advantage)",
      "Alaska Airlines moved OUT to Terminal 8 in October 2025",
      "CLEAR IS CLOSED (kiosks visible but not operational)",
    ],
    walkTimes: {
      curbToSecurity: { min: 3, max: 5 },
      securityToGates: { min: 1, max: 2 },
    },
    peakTimes: ["Varies by airline schedule"],
    accessNotes: ["New permanent roadway pattern (Oct 2025)"],
    lounges: ["Aer Lingus Lounge", "Alaska Lounge", "Lounge @ T7"],
  },

  "8": {
    id: "8",
    name: "Terminal 8 (American Airlines Hub)",
    airlines: [
      "American Airlines",
      "British Airways",
      "Iberia",
      "Japan Airlines",
      "Qantas",
      "Qatar Airways",
      "Alaska Airlines",
      "Cathay Pacific",
      "Finnair",
      "Hawaiian Airlines",
      "China Southern",
      "Royal Jordanian",
    ],
    primaryAirline: "American Airlines",
    securityOptions: {
      precheck: true,
      precheckHours: { open: "03:30", close: "22:00" },
      clear: false,
      touchlessId: true, // For AA
      t4Reserve: false,
    },
    status:
      "Large terminal, recently expanded (2022). Oneworld alliance hub. Largest terminal at JFK by passenger volume.",
    notes: [
      "31 gates across two concourses (B and C)",
      "WARNING: Concourse C requires underground tunnel with moving walkways",
      "Add 10-15 min walk time for Concourse C gates",
      "Food options limited due to construction",
      "Alaska Airlines moved here Oct 2025",
      "Hawaiian Airlines moved here April 2025",
    ],
    walkTimes: {
      curbToSecurity: { min: 5, max: 8 },
      securityToGates: { min: 5, max: 8 },
      concourseC: { min: 10, max: 15 },
    },
    peakTimes: ["5-8am", "4-7pm"],
    accessNotes: [
      "Now accessed via JFK Expressway (NOT Van Wyck)",
      "This catches repeat visitors off guard",
    ],
    lounges: [
      "Admirals Club",
      "Greenwich Lounge",
      "Soho Lounge",
      "Chelsea Lounge (premium/elite only)",
    ],
  },
};

export function getTerminal(id: TerminalId): Terminal {
  return terminals[id];
}

export function getAllTerminals(): Terminal[] {
  return Object.values(terminals);
}

// Get average walk time for a terminal
export function getAverageWalkTime(
  terminalId: TerminalId,
  includeConcoursC = false
): number {
  const terminal = terminals[terminalId];
  const curbToSecurity =
    (terminal.walkTimes.curbToSecurity.min +
      terminal.walkTimes.curbToSecurity.max) /
    2;
  let securityToGates =
    (terminal.walkTimes.securityToGates.min +
      terminal.walkTimes.securityToGates.max) /
    2;

  // Add Concourse C time for T8 if applicable
  if (includeConcoursC && terminal.walkTimes.concourseC) {
    securityToGates =
      (terminal.walkTimes.concourseC.min + terminal.walkTimes.concourseC.max) /
      2;
  }

  return curbToSecurity + securityToGates;
}

// Check if CLEAR is available and open
export function isClearAvailable(terminalId: TerminalId): boolean {
  const terminal = terminals[terminalId];
  return terminal.securityOptions.clear && terminal.securityOptions.clearStatus === "open";
}

// Check if T4 Reserve is available
export function isT4ReserveAvailable(terminalId: TerminalId): boolean {
  return terminals[terminalId].securityOptions.t4Reserve;
}

// Check if Touchless ID is available
export function isTouchlessIdAvailable(terminalId: TerminalId): boolean {
  return terminals[terminalId].securityOptions.touchlessId;
}

// Check if PreCheck is open at a given time
export function isPrecheckOpen(terminalId: TerminalId, time: Date): boolean {
  const terminal = terminals[terminalId];
  if (!terminal.securityOptions.precheck) return false;

  const hours = terminal.securityOptions.precheckHours;
  if (!hours) return true; // Assume open if no hours specified

  const timeStr = time.toTimeString().slice(0, 5);
  return timeStr >= hours.open && timeStr <= hours.close;
}
