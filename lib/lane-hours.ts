import { getAirportProfile } from "@/lib/airports";
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
 * standard lanes instead. Only acts on lane hours we hold for this exact terminal; never on a
 * fallback terminal, so a wrong terminal can't move the plan.
 */
export function applyLaneHours(flight: FlightInfo, research: Research, atCheckpointISO: string): Research {
  const lane = laneOf(research.lane);
  if (!lane || !flight.terminal) return research;
  const airport = getAirportProfile(flight.departureAirport);
  const terminal = airport.terminals.find((t) => t.id === flight.terminal);
  const hours = terminal?.security.serviceHours?.[lane];
  if (!terminal || !hours) return research;

  const local = instantToZonedParts(new Date(atCheckpointISO), flight.departureTimezone ?? airport.timezone);
  if (local.hhmm >= hours.opensAt && local.hhmm <= hours.closesAt) return research;

  const peak = (local.hour >= 5 && local.hour < 9) || (local.hour >= 15 && local.hour < 19);
  const standard = peak ? terminal.security.waitEstimate.peak : terminal.security.waitEstimate.normal;
  const when = local.hhmm > hours.closesAt ? `closes at ${clock(hours.closesAt)}` : `opens at ${clock(hours.opensAt)}`;
  return {
    ...research,
    lane: "standard lanes",
    securityMinutes: Math.max(research.securityMinutes, standard),
    securityNotes: [`${LANE_NAME[lane]} at ${terminal.name} ${when}, so plan for standard lanes.`, ...research.securityNotes].slice(0, 2),
  };
}
