import type { FlightInfo } from "@/types/flight";
import type { Mode, PlanResult, Research, RouteEstimate, TimelineStop } from "@/types/plan";

const MIN = 60_000;

export interface PlanMathInput {
  flight: FlightInfo;
  route: RouteEstimate;
  research: Research;
  bufferMinutes: number;
  checkedBag: boolean;
  mode?: Mode;
  now?: Date;
}

/**
 * Subtract backwards from departure. Two paths constrain the leave time:
 *  - the gate path: departure - boarding lead - gate buffer - walks - security - drive
 *  - the bag path: departure - bag cutoff - walk to counter - drive
 * The earlier of the two wins. The client can re-run the gate path for a new
 * buffer instantly: leave = min(anchor - buffer, bagLeave).
 */
export function computePlan(input: PlanMathInput): PlanResult {
  const { flight, route, research: r, bufferMinutes, checkedBag } = input;
  const mode: Mode = input.mode ?? "ride";
  const now = input.now ?? new Date();
  const departure = new Date(flight.departureTime).getTime();

  const boarding = departure - r.boardingLeadMinutes * MIN;
  const atGateNoBuffer = boarding; // with buffer: atGate = boarding - buffer
  const throughSecurityNoBuffer = atGateNoBuffer - r.checkpointToGateMinutes * MIN;
  const atCheckpointNoBuffer = throughSecurityNoBuffer - r.securityMinutes * MIN;
  const atCurbNoBuffer = atCheckpointNoBuffer - r.curbToCheckpointMinutes * MIN;
  const anchor = atCurbNoBuffer - r.driveMinutes * MIN;

  let bagLeave: number | null = null;
  if (checkedBag && r.bagDropCutoffMinutes) {
    const atCounterBy = departure - r.bagDropCutoffMinutes * MIN;
    const atCurbForBag = atCounterBy - 5 * MIN;
    bagLeave = atCurbForBag - r.driveMinutes * MIN;
  }

  const gateLeave = anchor - bufferMinutes * MIN;
  const rawLeave = bagLeave !== null ? Math.min(gateLeave, bagLeave) : gateLeave;
  // Round down to a clean 5-minute mark; the extra minutes become spare time before boarding.
  const leave = Math.floor(rawLeave / (5 * MIN)) * 5 * MIN;
  const bagBound = bagLeave !== null && bagLeave < gateLeave;

  // Timeline follows the binding path so the stops add up.
  const curb = leave + r.driveMinutes * MIN;
  const atCheckpoint = curb + r.curbToCheckpointMinutes * MIN;
  const throughSecurity = atCheckpoint + r.securityMinutes * MIN;
  const atGate = throughSecurity + r.checkpointToGateMinutes * MIN;

  const timeline: TimelineStop[] = [
    { key: "leave", label: "Walk out the door", iso: new Date(leave).toISOString() },
    { key: "curb", label: mode === "transit" ? "At the terminal" : mode === "drive" ? "Parked, at the terminal" : "At the curb", iso: new Date(curb).toISOString() },
    { key: "checkpoint", label: "In the security line", iso: new Date(atCheckpoint).toISOString() },
    { key: "security", label: "Through security", iso: new Date(throughSecurity).toISOString() },
    { key: "gate", label: "At the gate", iso: new Date(atGate).toISOString() },
    { key: "boarding", label: "Boarding starts", iso: new Date(boarding).toISOString() },
    { key: "departure", label: "Departure", iso: new Date(departure).toISOString() },
  ];

  return {
    flight,
    route,
    research: bagBound
      ? { ...r, headsUp: dedupe([`Bag drop closes ${r.bagDropCutoffMinutes} minutes before departure, and that sets your leave time.`, ...r.headsUp]).slice(0, 3) }
      : r,
    mode,
    checkedBag,
    bufferMinutes,
    anchorISO: new Date(anchor).toISOString(),
    bagLeaveISO: bagLeave !== null ? new Date(bagLeave).toISOString() : null,
    leaveISO: new Date(leave).toISOString(),
    timeline,
    isLate: leave < now.getTime(),
    generatedAt: now.toISOString(),
  };
}

function dedupe(items: string[]) {
  return Array.from(new Set(items));
}
