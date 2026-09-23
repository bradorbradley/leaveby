import { minutesBetween } from "@/lib/format";
import type { Mode, PlanResult } from "@/types/plan";

export interface PlanSegment {
  label: string;
  min: number;
}

export interface PlanRow {
  key: "leave" | "arrive" | "security" | "gate" | "spare" | "boarding" | "departure";
  iso: string;
  title: string;
  seg?: PlanSegment;
  lead?: string;
  notes: string[];
}

/** The seven chapters of a plan, with the minutes between them and the notes that belong to each. */
export function planRows(plan: PlanResult): { rows: PlanRow[]; total: number; latestISO: string } {
  const stops = plan.timeline;
  const r = plan.research;
  const mode: Mode = plan.mode;
  const seg = (a: number, b: number) => minutesBetween(stops[a].iso, stops[b].iso);
  const travelLabel = mode === "transit" ? "Transit" : mode === "drive" ? "Drive + park" : "Drive";
  const arriveLabel = mode === "ride" ? "Curb to security" : "Terminal to security";
  const segments: PlanSegment[] = [
    { label: travelLabel, min: seg(0, 1) },
    { label: arriveLabel, min: seg(1, 2) },
    { label: "Security", min: seg(2, 3) },
    { label: "Walk", min: seg(3, 4) },
    { label: "Until boarding", min: seg(4, 5) },
    { label: "Boarding to doors", min: seg(5, 6) },
  ];
  const total = segments.reduce((s, x) => s + x.min, 0);

  const securityNotes = [...r.securityNotes];
  if (plan.checkedBag && r.bagDropCutoffMinutes && !r.securityNotes.some((n) => /bag/i.test(n))) {
    securityNotes.push(`Bag drop closes ${r.bagDropCutoffMinutes} min before departure.`);
  }
  const arriveTitle = mode === "drive" ? "Parked at the airport" : "Arrive at the airport";
  const rows: PlanRow[] = [
    { key: "leave", iso: stops[0].iso, title: "Walk out the door", seg: segments[0], notes: r.driveNotes },
    { key: "arrive", iso: stops[1].iso, title: arriveTitle, seg: segments[1], notes: [] },
    { key: "security", iso: stops[2].iso, title: "Security", seg: segments[2], lead: r.checkpoint, notes: securityNotes },
    { key: "gate", iso: stops[3].iso, title: "Walk to the gate", seg: segments[3], notes: r.gateNotes },
    { key: "spare", iso: stops[4].iso, title: "Spare time", seg: segments[4], notes: [] },
    { key: "boarding", iso: stops[5].iso, title: "Boarding starts", seg: segments[5], notes: [] },
    { key: "departure", iso: stops[6].iso, title: "Departure", notes: [] },
  ];

  // The line you can't cross: the later of no spare time and the bag cutoff, floored to a clean five.
  const anchor = new Date(plan.anchorISO).getTime();
  const bag = plan.bagLeaveISO ? new Date(plan.bagLeaveISO).getTime() : Infinity;
  const latestISO = new Date(Math.floor(Math.min(anchor, bag) / 300_000) * 300_000).toISOString();

  return { rows, total, latestISO };
}
