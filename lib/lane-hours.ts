import { getAirportProfile, getTerminalProfile } from "@/lib/airports";
import { precheckWindow } from "@/lib/airports/precheck-hours";
import { instantToZonedParts } from "@/lib/tz";
import type { FlightInfo } from "@/types/flight";
import type { Research } from "@/types/plan";

type Lane = "precheck" | "clear";

const LANE_NAME: Record<Lane, string> = { precheck: "TSA PreCheck", clear: "CLEAR" };

function laneOf(lane: string): Lane | null {
  if (/pre\s*-?check/i.test(lane)) return "precheck";
  if (/clear/i.test(lane)) return "clear";
  return null;
}

/** "20:00" → "8:00 PM". */
function clock(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/**
 * If the traveler's expedited lane is closed when they reach the checkpoint, plan them in
 * standard lanes instead. Uses lane hours from our terminal data for that exact terminal, then
 * the PreCheck hours from the airport guides. Never guesses a terminal, so a wrong terminal
 * can't move the plan.
 */
export function applyLaneHours(flight: FlightInfo, research: Research, atCheckpointISO: string): Research {
  const lane = laneOf(research.lane);
  if (!lane) return research;
  const airport = getAirportProfile(flight.departureAirport);
  const terminal = flight.terminal ? airport.terminals.find((t) => t.id === flight.terminal) : undefined;
  const fromGuide = lane === "precheck" ? precheckWindow(flight.departureAirport, flight.terminal) : null;
  const hours = terminal?.security.serviceHours?.[lane] ?? fromGuide?.window;
  if (!hours) return research;
  const place = terminal?.security.serviceHours?.[lane]
    ? terminal.name
    : fromGuide?.terminalKey === "*"
      ? flight.departureAirport
      : `Terminal ${fromGuide?.terminalKey}`;

  const local = instantToZonedParts(new Date(atCheckpointISO), flight.departureTimezone ?? airport.timezone);
  if (local.hhmm >= hours.opensAt && local.hhmm <= hours.closesAt) return research;

  const wait = (terminal ?? getTerminalProfile(flight.departureAirport, flight.terminal))?.security.waitEstimate ?? { normal: 25, peak: 40 };
  const peak = (local.hour >= 5 && local.hour < 9) || (local.hour >= 15 && local.hour < 19);
  const standard = peak ? wait.peak : wait.normal;
  const when = local.hhmm > hours.closesAt ? `closes at ${clock(hours.closesAt)}` : `opens at ${clock(hours.opensAt)}`;
  return {
    ...research,
    lane: "standard lanes",
    securityMinutes: Math.max(research.securityMinutes, standard),
    securityNotes: [`${LANE_NAME[lane]} at ${place} ${when}, so plan for standard lanes.`, ...research.securityNotes].slice(0, 2),
  };
}
