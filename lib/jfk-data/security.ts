import type { TerminalId, SecurityType } from "@/types/jfk";
import { terminals } from "./terminals";

// Base security wait times (in minutes) by terminal
// These are heuristics used when live data is unavailable
export const baseSecurityTimes: Record<
  TerminalId,
  {
    offPeak: number;
    normal: number;
    peak: number;
    holidayPeak: number;
  }
> = {
  "1": { offPeak: 20, normal: 30, peak: 45, holidayPeak: 60 },
  "4": { offPeak: 25, normal: 35, peak: 50, holidayPeak: 60 },
  "5": { offPeak: 15, normal: 20, peak: 30, holidayPeak: 45 },
  "7": { offPeak: 15, normal: 20, peak: 30, holidayPeak: 40 },
  "8": { offPeak: 20, normal: 30, peak: 45, holidayPeak: 60 },
};

// Security screening time (time spent in actual screening, not waiting)
export const screeningTimes: Record<SecurityType, number> = {
  standard: 6, // 5-7 min
  precheck: 2.5, // 2-3 min
  clear: 4, // 3-5 min (biometric + screening)
  global_entry: 2.5, // Same as PreCheck for domestic
  touchless_id: 1.5, // 1-2 min - fastest
};

// PreCheck wait time reduction (percentage of standard wait)
export const precheckReduction = 0.45; // Reduce to 45% of standard (55% reduction)

// CLEAR wait time (near-instant at CLEAR pod, but still need TSA screening)
export const clearWaitTime = 3; // Minutes in CLEAR line itself

// Touchless ID is the fastest - essentially no wait
export const touchlessIdWaitTime = 2;

// Get estimated security wait time
export function getEstimatedSecurityWait(
  terminalId: TerminalId,
  securityType: SecurityType,
  peakLevel: "offPeak" | "normal" | "peak" | "holidayPeak"
): number {
  const baseTime = baseSecurityTimes[terminalId][peakLevel];
  const terminal = terminals[terminalId];

  switch (securityType) {
    case "touchless_id":
      // Only available at T4 (Delta) and T8 (AA)
      if (terminal.securityOptions.touchlessId) {
        return touchlessIdWaitTime + screeningTimes.touchless_id;
      }
      // Fall through to precheck if touchless not available
      return baseTime * precheckReduction + screeningTimes.precheck;

    case "clear":
      // Only available at T4 and must be open
      if (
        terminal.securityOptions.clear &&
        terminal.securityOptions.clearStatus === "open"
      ) {
        return clearWaitTime + screeningTimes.clear;
      }
      // Fall through to precheck if CLEAR not available
      if (terminal.securityOptions.precheck) {
        return baseTime * precheckReduction + screeningTimes.precheck;
      }
      return baseTime + screeningTimes.standard;

    case "precheck":
    case "global_entry":
      if (terminal.securityOptions.precheck) {
        return baseTime * precheckReduction + screeningTimes.precheck;
      }
      return baseTime + screeningTimes.standard;

    case "standard":
    default:
      return baseTime + screeningTimes.standard;
  }
}

// Check if PreCheck lanes are open at a given time
export function arePrecheckLanesOpen(
  terminalId: TerminalId,
  time: Date
): boolean {
  const terminal = terminals[terminalId];
  if (!terminal.securityOptions.precheck) return false;

  const hours = terminal.securityOptions.precheckHours;
  if (!hours) return true;

  const timeStr = time.toTimeString().slice(0, 5);
  return timeStr >= hours.open && timeStr <= hours.close;
}

// Check if CLEAR is available and open at a given time
export function isClearOpen(terminalId: TerminalId, time: Date): boolean {
  const terminal = terminals[terminalId];
  if (!terminal.securityOptions.clear) return false;
  if (terminal.securityOptions.clearStatus !== "open") return false;

  const hours = terminal.securityOptions.clearHours;
  if (!hours) return true;

  const timeStr = time.toTimeString().slice(0, 5);
  return timeStr >= hours.open && timeStr <= hours.close;
}

// Get security warnings based on user's options and flight time
export function getSecurityWarnings(
  terminalId: TerminalId,
  securityTime: Date,
  hasPrecheck: boolean,
  hasClear: boolean
): string[] {
  const warnings: string[] = [];
  const terminal = terminals[terminalId];

  // PreCheck closed warning
  if (hasPrecheck && !arePrecheckLanesOpen(terminalId, securityTime)) {
    warnings.push(
      "PreCheck lanes may be closed at your security time. Allow extra time for standard screening."
    );
  }

  // CLEAR closed at T7 warning
  if (hasClear && terminalId === "7") {
    warnings.push(
      "CLEAR is temporarily closed at Terminal 7. You'll use PreCheck or standard screening."
    );
  }

  // CLEAR closed hours warning
  if (hasClear && terminalId === "4" && !isClearOpen(terminalId, securityTime)) {
    warnings.push(
      "CLEAR may be closed at your security time. You'll use PreCheck or standard screening."
    );
  }

  return warnings;
}

// Get pro tips for security
export function getSecurityProTips(
  terminalId: TerminalId,
  hasPrecheck: boolean,
  hasClear: boolean
): string[] {
  const tips: string[] = [];
  const terminal = terminals[terminalId];

  // T4 Reserve tip
  if (terminal.securityOptions.t4Reserve) {
    tips.push(
      "Book a free T4 RESERVE slot at jfkt4.nyc to schedule your security time."
    );
  }

  // CLEAR at T4 tip
  if (terminalId === "4" && !hasClear && !hasPrecheck) {
    tips.push(
      "Terminal 4 has CLEAR available - members can skip to the front of security."
    );
  }

  // T4 arrivals level tip
  if (terminalId === "4") {
    tips.push(
      "The arrivals level security checkpoint at T4 is often shorter than departures level."
    );
  }

  // T7 compact terminal tip
  if (terminalId === "7") {
    tips.push(
      "Terminal 7 is compact - gates are only 1-2 minutes from security."
    );
  }

  // T8 Concourse C warning/tip
  if (terminalId === "8") {
    tips.push(
      "If your gate is in Concourse C (gates 31-47), allow extra time for the underground tunnel walk."
    );
  }

  return tips;
}
