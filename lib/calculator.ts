import { subMinutes } from "date-fns";
import type {
  CalculationInput,
  CalculationResult,
  BreakdownStep,
  FlightInfo,
  TerminalId,
  SecurityType,
} from "@/types/jfk";
import {
  terminals,
  getTerminalForAirline,
  parseFlightNumber,
  getAirlineName,
  getPeakDayInfo,
  getTimeOfDayMultiplier,
  getEstimatedSecurityWait,
  getSecurityWarnings,
  getSecurityProTips,
  arePrecheckLanesOpen,
  isClearOpen,
  getBagCheckCutoff,
  getCheckInTime,
  getBagDropTime,
  getConstructionBuffer,
  boardingTimes,
} from "@/lib/jfk-data";

interface CalculatorParams {
  input: CalculationInput;
  travelTimeMinutes: number;
  securityWaitMinutes?: number; // If provided, use this instead of estimate
  flightInfo?: Partial<FlightInfo>; // Additional flight info from scraping
}

export function calculateLeaveByTime(params: CalculatorParams): CalculationResult {
  const { input, travelTimeMinutes, securityWaitMinutes, flightInfo } = params;

  // Parse flight number
  const parsed = parseFlightNumber(input.flightNumber);
  if (!parsed) {
    throw new Error("Invalid flight number");
  }

  const terminalId = getTerminalForAirline(parsed.airlineCode);
  if (!terminalId) {
    throw new Error("Unknown airline");
  }

  const terminal = terminals[terminalId];
  const airlineName = getAirlineName(parsed.airlineCode);

  // Determine if international (use provided info or default to false)
  const isInternational = flightInfo?.isInternational ?? false;

  // Create flight info object
  const flight: FlightInfo = {
    flightNumber: input.flightNumber.toUpperCase(),
    airline: airlineName,
    airlineCode: parsed.airlineCode,
    destination: flightInfo?.destination ?? "Unknown",
    departureTime: input.date,
    terminal: terminalId,
    gate: flightInfo?.gate,
    status: flightInfo?.status ?? "on_time",
    delayMinutes: flightInfo?.delayMinutes,
    isInternational,
  };

  // Get peak day info
  const peakDayInfo = getPeakDayInfo(input.date);
  const isPeakDay = peakDayInfo !== null;
  const peakMultiplier = peakDayInfo?.securityMultiplier ?? 1.0;

  // Determine security type
  let securityType: SecurityType = "standard";
  if (input.hasTouchlessId && terminal.securityOptions.touchlessId) {
    securityType = "touchless_id";
  } else if (input.hasClear && terminal.securityOptions.clear) {
    securityType = "clear";
  } else if (input.hasPrecheck || input.hasGlobalEntry) {
    securityType = "precheck";
  }

  // Calculate boarding time
  const boardingBuffer = isInternational
    ? boardingTimes.international.start
    : boardingTimes.domestic.start;
  const boardingTime = subMinutes(input.date, boardingBuffer);

  // Calculate each time component
  const breakdown: BreakdownStep[] = [];
  let totalMinutes = 0;

  // 1. Travel time + construction buffer
  const constructionBuffer = getConstructionBuffer(input.date);
  const totalTravelTime = travelTimeMinutes + constructionBuffer;
  breakdown.push({
    id: "travel",
    icon: "car",
    label: `Travel to JFK T${terminalId}`,
    minutes: totalTravelTime,
    details: `${travelTimeMinutes} min current travel time + ${constructionBuffer} min JFK construction buffer`,
  });
  totalMinutes += totalTravelTime;

  // 2. Check-in/bag drop (if checking bag)
  if (input.checkingBag) {
    const checkInTime = getCheckInTime(true, input.airlineStatus);
    const bagDropTime = getBagDropTime(input.airlineStatus, input.hasTouchlessId);

    if (checkInTime > 0) {
      breakdown.push({
        id: "checkin",
        icon: "checkin",
        label: "Check-in",
        minutes: checkInTime,
        details:
          input.airlineStatus !== "none"
            ? "Priority check-in line"
            : "Standard check-in counter",
      });
      totalMinutes += checkInTime;
    }

    breakdown.push({
      id: "bagdrop",
      icon: "bag",
      label: "Bag drop",
      minutes: bagDropTime,
      details: input.hasTouchlessId
        ? "Touchless bag drop (~30 seconds)"
        : input.airlineStatus !== "none"
        ? "Priority bag drop"
        : "Standard bag drop line",
    });
    totalMinutes += bagDropTime;
  }

  // 3. Walk to security
  const curbToSecurityWalk =
    (terminal.walkTimes.curbToSecurity.min + terminal.walkTimes.curbToSecurity.max) / 2;
  breakdown.push({
    id: "walk_to_security",
    icon: "walk",
    label: "Walk to security",
    minutes: Math.round(curbToSecurityWalk),
    details: `${terminal.name} curb to security checkpoint`,
  });
  totalMinutes += Math.round(curbToSecurityWalk);

  // 4. Security wait
  const hour = input.date.getHours();
  const timeOfDayMultiplier = getTimeOfDayMultiplier(hour);

  // Determine peak level for security estimate
  let peakLevel: "offPeak" | "normal" | "peak" | "holidayPeak" = "normal";
  if (peakDayInfo?.type === "extreme") {
    peakLevel = "holidayPeak";
  } else if (peakDayInfo?.type === "high" || timeOfDayMultiplier >= 1.3) {
    peakLevel = "peak";
  } else if (timeOfDayMultiplier <= 0.9) {
    peakLevel = "offPeak";
  }

  // Use provided security wait or estimate
  let securityWait = securityWaitMinutes;
  if (securityWait === undefined) {
    securityWait = getEstimatedSecurityWait(terminalId, securityType, peakLevel);
  }

  // Apply peak day multiplier if using estimate
  if (securityWaitMinutes === undefined) {
    securityWait = Math.round(securityWait * peakMultiplier);
  }

  const securityLabel =
    securityType === "touchless_id"
      ? "Security (Touchless ID)"
      : securityType === "clear"
      ? "Security (CLEAR)"
      : securityType === "precheck"
      ? "Security (PreCheck)"
      : "Security";

  breakdown.push({
    id: "security",
    icon: "security",
    label: securityLabel,
    minutes: securityWait,
    details: isPeakDay
      ? `Estimated wait adjusted for ${peakDayInfo?.description || "peak travel"}`
      : "Estimated based on current conditions",
  });
  totalMinutes += securityWait;

  // 5. Walk to gate
  let securityToGateWalk =
    (terminal.walkTimes.securityToGates.min + terminal.walkTimes.securityToGates.max) / 2;

  // Check for Concourse C at T8 (gates 31-47)
  const gate = flightInfo?.gate;
  let isConcourseCGate = false;
  if (terminalId === "8" && gate) {
    const gateNum = parseInt(gate.replace(/\D/g, ""));
    if (gateNum >= 31 && gateNum <= 47) {
      isConcourseCGate = true;
      securityToGateWalk =
        (terminal.walkTimes.concourseC!.min + terminal.walkTimes.concourseC!.max) / 2;
    }
  }

  breakdown.push({
    id: "walk_to_gate",
    icon: "walk",
    label: gate ? `Walk to gate ${gate}` : "Walk to gate",
    minutes: Math.round(securityToGateWalk),
    details: isConcourseCGate
      ? "Concourse C via underground tunnel with moving walkways"
      : `${terminal.name} concourse`,
  });
  totalMinutes += Math.round(securityToGateWalk);

  // 6. Buffer before boarding
  breakdown.push({
    id: "buffer",
    icon: "clock",
    label: "Buffer before boarding",
    minutes: input.bufferPreference,
    details: "Time to relax, grab food, or handle any delays",
  });
  totalMinutes += input.bufferPreference;

  // Calculate leave-by time
  const leaveByTime = subMinutes(input.date, totalMinutes);

  // Check bag cutoff constraint
  const bagCutoff = getBagCheckCutoff(isInternational, input.checkingBag);
  const minutesBeforeDeparture = totalMinutes;
  const warnings: string[] = [];

  if (input.checkingBag && minutesBeforeDeparture < bagCutoff + 15) {
    warnings.push(
      `JFK requires checked bags ${bagCutoff} minutes before departure. Consider leaving earlier.`
    );
  }

  // Get security warnings
  const securityTime = subMinutes(input.date, totalMinutes - travelTimeMinutes);
  const securityWarnings = getSecurityWarnings(
    terminalId,
    securityTime,
    input.hasPrecheck || input.hasGlobalEntry,
    input.hasClear
  );
  warnings.push(...securityWarnings);

  // Get pro tips
  const proTips = getSecurityProTips(terminalId, input.hasPrecheck, input.hasClear);

  // Add T8 Concourse C tip if applicable
  if (terminalId === "8" && !isConcourseCGate && !gate) {
    proTips.unshift(
      "If your gate is in Concourse C (gates 31-47), allow 10-15 extra minutes for the tunnel walk."
    );
  }

  return {
    leaveByTime,
    boardingTime,
    departureTime: input.date,
    totalMinutes,
    bufferMinutes: input.bufferPreference,
    breakdown,
    warnings,
    proTips,
    isPeakDay,
    peakDayType: peakDayInfo?.type,
    flightInfo: flight,
  };
}
