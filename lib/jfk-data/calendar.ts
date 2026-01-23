import type { PeakDayInfo } from "@/types/jfk";
import {
  isWeekend,
  getDay,
  getMonth,
  getDate,
  format,
  isSameDay,
} from "date-fns";

// Peak travel days for 2026
// These are the specific dates mentioned in the spec
const peakDays2026: {
  date: string;
  type: "extreme" | "high" | "moderate";
  description: string;
}[] = [
  // EXTREME days (add 50%+)
  {
    date: "2026-11-29",
    type: "extreme",
    description: "Sunday after Thanksgiving",
  },
  {
    date: "2026-11-25",
    type: "extreme",
    description: "Wednesday before Thanksgiving",
  },
  {
    date: "2026-12-18",
    type: "extreme",
    description: "Friday before Christmas",
  },
  { date: "2026-12-27", type: "extreme", description: "Sunday after Christmas" },
  { date: "2026-12-19", type: "extreme", description: "Pre-Christmas travel" },
  { date: "2026-12-20", type: "extreme", description: "Pre-Christmas travel" },
  { date: "2026-12-21", type: "extreme", description: "Pre-Christmas travel" },
  { date: "2026-12-26", type: "extreme", description: "Post-Christmas travel" },
  { date: "2026-12-28", type: "extreme", description: "Post-Christmas travel" },
  { date: "2026-12-29", type: "extreme", description: "Post-Christmas travel" },

  // HIGH days (add 30-40%)
  // Memorial Day weekend 2026 (May 22-25)
  {
    date: "2026-05-22",
    type: "high",
    description: "Friday before Memorial Day",
  },
  {
    date: "2026-05-25",
    type: "high",
    description: "Sunday after Memorial Day",
  },
  // July 4th 2026 (Saturday)
  { date: "2026-07-03", type: "high", description: "Friday before July 4th" },
  { date: "2026-07-05", type: "high", description: "Sunday after July 4th" },
  // Labor Day 2026 (Sept 7)
  { date: "2026-09-04", type: "high", description: "Friday before Labor Day" },
  { date: "2026-09-07", type: "high", description: "Sunday after Labor Day" },
  // Thanksgiving week 2026
  { date: "2026-11-26", type: "high", description: "Thanksgiving Day" },
  { date: "2026-11-27", type: "high", description: "Day after Thanksgiving" },
  { date: "2026-11-28", type: "high", description: "Thanksgiving weekend" },

  // MLK Day 2026 (Jan 19)
  { date: "2026-01-16", type: "high", description: "Friday before MLK Day" },
  { date: "2026-01-19", type: "high", description: "MLK Day weekend" },

  // Presidents Day 2026 (Feb 16)
  {
    date: "2026-02-13",
    type: "high",
    description: "Friday before Presidents Day",
  },
  { date: "2026-02-16", type: "high", description: "Presidents Day weekend" },
];

// Check if a specific date is a peak day
export function getPeakDayInfo(date: Date): PeakDayInfo | null {
  const dateStr = format(date, "yyyy-MM-dd");

  // Check specific peak days
  const specificDay = peakDays2026.find((d) => d.date === dateStr);
  if (specificDay) {
    return {
      date,
      type: specificDay.type,
      description: specificDay.description,
      securityMultiplier: getSecurityMultiplier(specificDay.type),
    };
  }

  // Check for recurring patterns
  const dayOfWeek = getDay(date); // 0 = Sunday, 5 = Friday
  const hour = date.getHours();

  // Sunday evenings (return travel)
  if (dayOfWeek === 0 && hour >= 14) {
    return {
      date,
      type: "moderate",
      description: "Sunday evening (return travel)",
      securityMultiplier: 1.2,
    };
  }

  // Friday afternoons/evenings (departure)
  if (dayOfWeek === 5 && hour >= 12) {
    return {
      date,
      type: "moderate",
      description: "Friday afternoon (departure rush)",
      securityMultiplier: 1.2,
    };
  }

  // Monday mornings (business travel)
  if (dayOfWeek === 1 && hour >= 5 && hour <= 10) {
    return {
      date,
      type: "moderate",
      description: "Monday morning (business travel)",
      securityMultiplier: 1.15,
    };
  }

  // Spring break period (mid-March to mid-April)
  const month = getMonth(date);
  const dayOfMonth = getDate(date);
  if (
    (month === 2 && dayOfMonth >= 15) || // Mid-March
    (month === 3 && dayOfMonth <= 15) // Mid-April
  ) {
    // Only on weekends during spring break
    if (isWeekend(date)) {
      return {
        date,
        type: "moderate",
        description: "Spring break weekend",
        securityMultiplier: 1.2,
      };
    }
  }

  return null;
}

// Get security time multiplier based on peak type
function getSecurityMultiplier(type: "extreme" | "high" | "moderate"): number {
  switch (type) {
    case "extreme":
      return 1.5; // Add 50%
    case "high":
      return 1.35; // Add 35%
    case "moderate":
      return 1.2; // Add 20%
    default:
      return 1.0;
  }
}

// Check if it's a "lighter" travel day (good times to fly)
export function isLighterTravelDay(date: Date): boolean {
  const dayOfWeek = getDay(date);

  // Tuesday or Wednesday
  if (dayOfWeek === 2 || dayOfWeek === 3) {
    return true;
  }

  // Saturday before noon
  if (dayOfWeek === 6 && date.getHours() < 12) {
    return true;
  }

  // Check for actual holiday days (often lighter)
  const dateStr = format(date, "yyyy-MM-dd");
  const actualHolidays = [
    "2026-01-01", // New Year's Day
    "2026-11-26", // Thanksgiving Day (travel TO is done)
    "2026-12-25", // Christmas Day
  ];

  if (actualHolidays.includes(dateStr)) {
    return true;
  }

  // January/February (except holiday weekends)
  const month = getMonth(date);
  if (month === 0 || month === 1) {
    // Check it's not a holiday weekend
    const holidayWeekends = [
      "2026-01-16",
      "2026-01-17",
      "2026-01-18",
      "2026-01-19",
      "2026-02-13",
      "2026-02-14",
      "2026-02-15",
      "2026-02-16",
    ];
    if (!holidayWeekends.includes(dateStr)) {
      return true;
    }
  }

  return false;
}

// Get daily peak hours classification
export function getDailyPeakLevel(
  hour: number
): "peak" | "moderate-high" | "moderate-low" | "low" {
  if (hour >= 5 && hour < 8) return "peak"; // 5-8am
  if (hour >= 8 && hour < 11) return "moderate-high"; // 8-11am
  if (hour >= 11 && hour < 14) return "moderate-low"; // 11am-2pm (good window)
  if (hour >= 14 && hour < 16) return "moderate-low"; // 2-4pm
  if (hour >= 16 && hour < 19) return "peak"; // 4-7pm
  if (hour >= 19 && hour < 22) return "moderate-high"; // 7-10pm
  return "low"; // 10pm+ (red-eye)
}

// Get time-of-day security multiplier
export function getTimeOfDayMultiplier(hour: number): number {
  const level = getDailyPeakLevel(hour);
  switch (level) {
    case "peak":
      return 1.3;
    case "moderate-high":
      return 1.15;
    case "moderate-low":
      return 1.0;
    case "low":
      return 0.8;
    default:
      return 1.0;
  }
}
