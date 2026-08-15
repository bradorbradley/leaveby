import { formatISO, isBefore, parseISO, subMinutes } from "date-fns";

import { getAirportProfile, getTerminalProfile, isPeakTravelDate, isTerminalServiceOpen } from "@/lib/airports";
import type { CalculationOptions, CalculationResult } from "@/types/calculation";
import type { FlightInfo } from "@/types/flight";
import type { SecurityEstimate } from "@/types/security";
import type { TravelEstimate } from "@/types/traffic";
import type { WeatherEstimate } from "@/types/weather";

export function calculateLeaveByTime(input: {
  flight: FlightInfo;
  traffic: TravelEstimate;
  security: SecurityEstimate;
  weather: WeatherEstimate;
  options: CalculationOptions;
}): CalculationResult {
  const { flight, traffic, security, weather, options } = input;
  const airport = getAirportProfile(flight.departureAirport, {
    name: flight.departureAirportName,
    timezone: flight.departureTimezone,
    coord: flight.airportCoord,
  });
  const terminal = getTerminalProfile(flight.departureAirport, flight.terminal);
  const departure = parseISO(flight.departureTime);
  const boardingLead = airport.standardBoardingBuffer[flight.region];
  const boardingTime = subMinutes(departure, boardingLead);
  const peakTravel = isPeakTravelDate(departure, flight.departureTimezone ?? airport.timezone);

  const curbToSecurity = averageRange(terminal?.curbToSecurityMinutes ?? [5, 8]);
  const gateWalk = averageRange(terminal?.securityToGateMinutes ?? [6, 12]) + (needsConcoursePenalty(flight) ? 8 : 0);
  const checkInTime = options.mobileBoardingPass === false ? 5 : 0;
  const bagDropTime = options.checkedBag ? getBagDropTime(options.airlineStatus, options.hasTouchlessId) : 0;
  const securityScreeningTime = getScreeningTime(options);

  const airportArrivalMinutes =
    curbToSecurity +
    checkInTime +
    bagDropTime +
    security.adjustedWaitMinutes +
    securityScreeningTime +
    gateWalk;
  const totalMinutes = airportArrivalMinutes + traffic.durationMinutes + options.bufferMinutes;
  const leaveByTime = subMinutes(boardingTime, airportArrivalMinutes + traffic.durationMinutes + options.bufferMinutes);

  const warnings = buildWarnings({
    flight,
    traffic,
    security,
    weather,
    options,
    boardingTime,
    airportArrivalMinutes,
  });

  const proTips = buildProTips({
    flight,
    options,
    terminalName: terminal?.name ?? `Terminal ${flight.terminal ?? "?"}`,
  });

  const quality = flight.source.includes("Fallback")
    ? "fallback"
    : flight.source.includes("FlightAware") && !traffic.source.includes("Fallback")
      ? "live"
      : "mixed";

  return {
    leaveByTime: formatISO(leaveByTime),
    targetBufferMinutes: options.bufferMinutes,
    airportArrivalMinutes,
    travelMinutes: traffic.durationMinutes,
    totalMinutes,
    boardingTime: formatISO(boardingTime),
    departureTime: flight.departureTime,
    flight,
    traffic,
    security,
    weather,
    breakdown: filterBreakdown([
      {
        id: "travel",
        icon: options.mode === "transit" ? "train" : "car",
        label: `${options.mode === "transit" ? "Transit" : options.mode === "rideshare" ? "Ride" : "Drive"} to ${flight.departureAirport}${flight.terminal ? ` T${flight.terminal}` : ""}`,
        minutes: traffic.durationMinutes,
        detail: `${traffic.routeSummary}. ${traffic.trafficSummary} ${traffic.incidents.join(" ")}`.trim(),
      },
      {
        id: "bags",
        icon: options.checkedBag ? "briefcase" : "check",
        label: options.checkedBag ? "Check bag at counter" : "Check-in and head inside",
        minutes: checkInTime + bagDropTime,
        detail: options.checkedBag
          ? `Checked bag timing reflects ${options.airlineStatus || "standard"} service.`
          : "No checked bag time added.",
      },
      {
        id: "security-walk",
        icon: "footprints",
        label: "Walk to security",
        minutes: curbToSecurity,
        detail: `${terminal?.name ?? "Terminal"} curb-to-security walk estimate.`,
      },
      {
        id: "security",
        icon: "shield",
        label: `Security${options.hasTouchlessId ? " (Touchless ID)" : options.hasClear ? " (CLEAR)" : options.hasPreCheck || options.hasGlobalEntry ? " (PreCheck)" : ""}`,
        minutes: security.adjustedWaitMinutes + securityScreeningTime,
        detail: security.sourceNotes.join(" "),
      },
      {
        id: "gate-walk",
        icon: "plane",
        label: flight.gate ? `Walk to gate ${flight.gate}` : "Walk to gate area",
        minutes: gateWalk,
        detail: terminal?.notes.join(" ") ?? "Terminal walk estimate.",
      },
      {
        id: "buffer",
        icon: "clock-3",
        label: "Buffer before boarding",
        minutes: options.bufferMinutes,
        detail: `Targeting ${options.bufferMinutes} minutes after security before boarding.`,
      },
    ]),
    warnings,
    proTips,
    peakDayLabel: peakTravel.label,
    dataQuality: quality,
    isLate: isBefore(leaveByTime, new Date()),
  };
}

function buildWarnings(input: {
  flight: FlightInfo;
  traffic: TravelEstimate;
  security: SecurityEstimate;
  weather: WeatherEstimate;
  options: CalculationOptions;
  boardingTime: Date;
  airportArrivalMinutes: number;
}) {
  const warnings: string[] = [];
  const airport = getAirportProfile(input.flight.departureAirport);
  const terminal = getTerminalProfile(input.flight.departureAirport, input.flight.terminal);
  const bagCutoff = input.options.checkedBag
    ? airport.bagCutoffs[
        input.flight.region === "international" ? "checkedInternational" : "checkedDomestic"
      ]
    : airport.bagCutoffs[input.flight.region === "international" ? "carryOnInternational" : "carryOnDomestic"];

  if (input.options.checkedBag && input.airportArrivalMinutes < bagCutoff) {
    warnings.push(`Checked bags at ${input.flight.departureAirport} typically need ${bagCutoff} minutes before departure.`);
  }

  if (
    input.options.hasClear &&
    input.flight.departureAirport === "JFK" &&
    input.flight.terminal === "7"
  ) {
    warnings.push("CLEAR is currently closed at JFK Terminal 7. This timing assumes PreCheck or standard screening.");
  }

  if (
    (input.options.hasPreCheck || input.options.hasGlobalEntry) &&
    !isTerminalServiceOpen(
      input.flight.departureAirport,
      input.flight.terminal,
      "precheck",
      input.boardingTime,
      input.flight.departureTimezone,
    )
  ) {
    warnings.push("PreCheck lanes may be closed for your arrival window. This may fall back to standard screening.");
  }

  if (input.weather.impact === "moderate" || input.weather.impact === "severe") {
    warnings.push("Weather conditions may slow both roadway access and airport operations.");
  }

  if (input.traffic.incidents.length > 0) {
    warnings.push("Live route friction detected. Construction or congestion is already in play.");
  }

  if (input.traffic.durationMinutes > 240) {
    warnings.push(
      `Your starting point looks very far from ${input.flight.departureAirport} — double-check the flight number and that you're leaving from where you think.`,
    );
  }

  warnings.push("REAL ID or passport required for domestic travel.");
  // Skip airport-wide alerts that are about a different terminal than this trip.
  const terminalMentionPattern = /Terminal\s+([A-Z0-9]+)/gi;
  warnings.push(
    ...airport.alerts.filter((alert) => {
      const mentions = Array.from(alert.matchAll(terminalMentionPattern)).map((match) => match[1]);
      return mentions.length === 0 || !input.flight.terminal || mentions.includes(input.flight.terminal);
    }),
  );
  warnings.push(...(terminal?.accessNotes ?? []));

  return Array.from(new Set(warnings));
}

function buildProTips(input: { flight: FlightInfo; options: CalculationOptions; terminalName: string }) {
  const tips: string[] = [];
  if (input.flight.departureAirport === "JFK" && input.flight.terminal === "4") {
    tips.push("Book a free T4 RESERVE slot if you're within 72 hours of departure.");
  }

  if (input.options.hasTouchlessId) {
    tips.push("Open your airline app before arriving so biometric entry is ready.");
  }

  if (input.options.mode === "rideshare") {
    tips.push("Request your ride about 5 minutes before your leave-by time so the car arrives as you walk out.");
  }

  if (input.options.mode === "transit") {
    tips.push("Trains don't wait — check your line's live schedule and aim for one train earlier than you need.");
  }

  if (input.flight.region === "international") {
    tips.push("Have passport and bag-drop paperwork ready before joining the line.");
  }

  tips.push(`Double-check the terminal assignment for ${input.terminalName} before you get on airport roads.`);
  return tips;
}

function getBagDropTime(status: string, hasTouchlessId: boolean) {
  if (hasTouchlessId) return 1;
  if (/first|diamond|360|executive|platinum|business/i.test(status)) return 5;
  if (/gold|priority|mosaic|a-list/i.test(status)) return 8;
  return 12;
}

function getScreeningTime(options: CalculationOptions) {
  if (options.hasTouchlessId) return 2;
  if (options.hasClear) return 4;
  if (options.hasPreCheck || options.hasGlobalEntry) return 3;
  return 6;
}

function averageRange([min, max]: [number, number]) {
  return Math.round((min + max) / 2);
}

function needsConcoursePenalty(flight: FlightInfo) {
  return flight.departureAirport === "JFK" && flight.terminal === "8" && !!flight.gate?.match(/^3|4/);
}

function filterBreakdown(items: import("@/types/calculation").BreakdownItem[]) {
  return items.filter((item) => item.minutes > 0 || item.id === "buffer");
}
