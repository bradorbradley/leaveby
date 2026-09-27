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
 *  - the gate path: departure - boarding lead - gate buffer - walks - passport control - security - drive
 *  - the bag path: departure - bag cutoff - walk to counter - drive
 * The earlier of the two wins. The client can re-run the gate path for a new
 * buffer instantly: leave = min(anchor - buffer, bagLeave).
 */
export function computePlan(input: PlanMathInput): PlanResult {
  const { flight, route, research: r, bufferMinutes, checkedBag } = input;
  const mode: Mode = input.mode ?? "ride";
  const now = input.now ?? new Date();
  const departure = new Date(flight.departureTime).getTime();

  // Security and passport control, in the order this airport runs them.
  const border = Math.max(0, r.borderMinutes ?? 0);
  const borderName = (r.borderLabel || "passport control").toLowerCase();
  const screening: Array<{ key: "security" | "border"; minutes: number; label: string }> = [
    { key: "security" as const, minutes: r.securityMinutes, label: "Through security" },
    ...(border > 0 ? [{ key: "border" as const, minutes: border, label: `Through ${borderName}` }] : []),
  ];
  if (r.borderFirst && border > 0) screening.reverse();
  const screeningMinutes = screening.reduce((sum, step) => sum + step.minutes, 0);

  const boarding = departure - r.boardingLeadMinutes * MIN;
  const atGateNoBuffer = boarding; // with buffer: atGate = boarding - buffer
  const clearedNoBuffer = atGateNoBuffer - r.checkpointToGateMinutes * MIN;
  const atCheckpointNoBuffer = clearedNoBuffer - screeningMinutes * MIN;
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
  let cursor = atCheckpoint;
  const screeningStops: TimelineStop[] = screening.map((step) => {
    cursor += step.minutes * MIN;
    return { key: step.key, label: step.label, iso: new Date(cursor).toISOString() };
  });
  const atGate = cursor + r.checkpointToGateMinutes * MIN;

  const timeline: TimelineStop[] = [
    { key: "leave", label: "Walk out the door", iso: new Date(leave).toISOString() },
    { key: "curb", label: mode === "transit" ? "At the terminal" : mode === "drive" ? "Parked, at the terminal" : "At the curb", iso: new Date(curb).toISOString() },
    { key: "checkpoint", label: screening[0].key === "border" ? `In the ${borderName} line` : "In the security line", iso: new Date(atCheckpoint).toISOString() },
    ...screeningStops,
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
