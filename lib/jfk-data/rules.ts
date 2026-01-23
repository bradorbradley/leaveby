import type { BagCheckRule } from "@/types/jfk";

// JFK-specific bag check cutoff rules
// JFK has STRICTER rules than other airports
export const bagCheckCutoffs: BagCheckRule[] = [
  {
    scenario: "JFK domestic with checked bag",
    cutoffMinutes: 60,
    isInternational: false,
    hasCheckedBag: true,
  },
  {
    scenario: "JFK international with checked bag",
    cutoffMinutes: 60,
    isInternational: true,
    hasCheckedBag: true,
  },
  {
    scenario: "JFK domestic without checked bag",
    cutoffMinutes: 30,
    isInternational: false,
    hasCheckedBag: false,
  },
  {
    scenario: "JFK international without checked bag",
    cutoffMinutes: 60,
    isInternational: true,
    hasCheckedBag: false,
  },
];

// Get the appropriate cutoff time
export function getBagCheckCutoff(
  isInternational: boolean,
  hasCheckedBag: boolean
): number {
  const rule = bagCheckCutoffs.find(
    (r) => r.isInternational === isInternational && r.hasCheckedBag === hasCheckedBag
  );
  return rule?.cutoffMinutes ?? 60; // Default to 60 if not found
}

// Boarding times (minutes before departure)
export const boardingTimes = {
  domestic: {
    start: 30, // Boarding typically begins
    must: 15, // Must be at gate ready to board
  },
  international: {
    start: 45,
    must: 20,
  },
};

// Check-in times by status/method
export const checkInTimes: Record<string, number> = {
  mobile: 0, // Already checked in
  kiosk: 5,
  counter_no_status: 12, // 10-15 min average
  counter_status: 5, // Priority check-in
  counter_premium: 4, // First class
};

// Bag drop times by status
export const bagDropTimes: Record<string, number> = {
  standard: 12, // 10-15 min average
  priority: 7, // 5-10 min
  premium: 4, // First class
  touchless: 0.5, // Delta Touchless ID - ~30 seconds
};

// Get check-in time based on status
export function getCheckInTime(
  hasCheckedBag: boolean,
  status: string
): number {
  if (!hasCheckedBag) {
    return checkInTimes.mobile; // Assume mobile check-in
  }

  switch (status) {
    case "diamond":
    case "360":
    case "executive_platinum":
    case "concierge_key":
    case "first":
      return checkInTimes.counter_premium;
    case "platinum":
    case "platinum_pro":
    case "gold":
    case "mosaic":
    case "mosaic_2":
    case "mosaic_3":
    case "mosaic_4":
    case "mvp_gold":
    case "mvp_gold_75k":
      return checkInTimes.counter_status;
    default:
      return checkInTimes.counter_no_status;
  }
}

// Get bag drop time based on status and touchless availability
export function getBagDropTime(
  status: string,
  hasTouchlessId: boolean
): number {
  if (hasTouchlessId) {
    return bagDropTimes.touchless;
  }

  switch (status) {
    case "diamond":
    case "360":
    case "executive_platinum":
    case "concierge_key":
    case "first":
      return bagDropTimes.premium;
    case "platinum":
    case "platinum_pro":
    case "gold":
    case "mosaic":
    case "mosaic_2":
    case "mosaic_3":
    case "mosaic_4":
    case "mvp_gold":
    case "mvp_gold_75k":
    case "silver":
    case "mvp":
      return bagDropTimes.priority;
    default:
      return bagDropTimes.standard;
  }
}

// Get minimum time required at airport based on rules
export function getMinimumAirportTime(
  isInternational: boolean,
  hasCheckedBag: boolean
): number {
  const cutoff = getBagCheckCutoff(isInternational, hasCheckedBag);
  const boarding = isInternational
    ? boardingTimes.international.must
    : boardingTimes.domestic.must;

  // The cutoff already accounts for the time needed
  // We return the cutoff since that's when bag check closes
  return cutoff;
}

// Construction buffer rules
export const constructionBuffers = {
  baseline: 15, // Always add 15 min for JFK construction
  peakHours: 30, // Add 30 min during rush hours
  weekend: 20, // Slightly less on weekends
};

// Get construction buffer based on time
export function getConstructionBuffer(date: Date): number {
  const hour = date.getHours();
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend) {
    return constructionBuffers.weekend;
  }

  // Rush hours: 7-10am, 4-7pm
  if ((hour >= 7 && hour < 10) || (hour >= 16 && hour < 19)) {
    return constructionBuffers.peakHours;
  }

  return constructionBuffers.baseline;
}

// International destinations (for detecting international flights)
// This is a simplified check - real app would use flight data
export const internationalHubs = [
  "LHR",
  "CDG",
  "FRA",
  "AMS",
  "DUB",
  "LGW",
  "MAN",
  "FCO",
  "BCN",
  "MAD",
  "MUC",
  "ZRH",
  "VIE",
  "CPH",
  "ARN",
  "OSL",
  "HEL",
  "ICN",
  "NRT",
  "HND",
  "HKG",
  "SIN",
  "SYD",
  "MEL",
  "AKL",
  "DXB",
  "DOH",
  "TLV",
  "CUN",
  "MEX",
  "GRU",
  "EZE",
  "BOG",
  "LIM",
  "SCL",
  "YYZ",
  "YVR",
  "YUL",
];

// Check if a destination is likely international
export function isLikelyInternational(destinationCode: string): boolean {
  const code = destinationCode.toUpperCase();
  return internationalHubs.includes(code);
}
