import { minutesBetween } from "@/lib/format";
import type { Mode, PlanResult, TimelineStop } from "@/types/plan";

export interface PlanSegment {
  label: string;
  min: number;
}

export interface PlanRow {
  key: "leave" | "arrive" | "security" | "border" | "gate" | "spare" | "boarding" | "departure";
  iso: string;
  title: string;
  /** Overrides the chapter's usual eyebrow, e.g. when passport control comes before security. */
  eyebrow?: string;
  seg?: PlanSegment;
  lead?: string;
  notes: string[];
}

/** The chapters of a plan, with the minutes between them and the notes that belong to each. */
export function planRows(plan: PlanResult): { rows: PlanRow[]; total: number; latestISO: string } {
  const r = plan.research;
  const mode: Mode = plan.mode;
  // Look stops up by key: passport control is there only on trips that have it.
  const at = (key: TimelineStop["key"]) => plan.timeline.find((s) => s.key === key)?.iso;
  const leave = at("leave")!;
  const curb = at("curb")!;
  const checkpoint = at("checkpoint")!;
  const gate = at("gate")!;
  const boarding = at("boarding")!;
  const departure = at("departure")!;

  const travelLabel = mode === "transit" ? "Transit" : mode === "drive" ? "Drive + park" : "Drive";
  const arriveLabel = mode === "ride" ? "Curb to security" : "Terminal to security";
  const securityNotes = [...r.securityNotes];
  if (plan.checkedBag && r.bagDropCutoffMinutes && !r.securityNotes.some((n) => /bag/i.test(n))) {
    securityNotes.push(`Bag drop closes ${r.bagDropCutoffMinutes} min before departure.`);
  }
  const arriveTitle = mode === "drive" ? "Parked at the airport" : "Arrive at the airport";

  // Security and passport control, in the order the timeline has them (passport control only on trips that have it).
  const borderTitle = r.borderLabel || "Passport control";
  let cleared = checkpoint;
  const screeningRows: PlanRow[] = plan.timeline
    .filter((s) => s.key === "security" || s.key === "border")
    .map((stop, i, all) => {
      const from = cleared;
      cleared = stop.iso;
      const min = minutesBetween(from, stop.iso);
      const eyebrow = i === 0 ? "In line by" : `Through ${all[i - 1].key === "border" ? borderTitle.charAt(0).toLowerCase() + borderTitle.slice(1) : "security"} by`;
      return stop.key === "security"
        ? { key: "security" as const, iso: from, title: "Security", eyebrow, seg: { label: "Security", min }, lead: r.checkpoint, notes: securityNotes }
        : { key: "border" as const, iso: from, title: borderTitle, eyebrow, seg: { label: "Wait", min }, notes: r.borderNotes ?? [] };
    });
  const rows: PlanRow[] = [
    { key: "leave", iso: leave, title: "Walk out the door", seg: { label: travelLabel, min: minutesBetween(leave, curb) }, notes: r.driveNotes },
    { key: "arrive", iso: curb, title: arriveTitle, seg: { label: arriveLabel, min: minutesBetween(curb, checkpoint) }, notes: [] },
    ...screeningRows,
    { key: "gate", iso: cleared, title: "Walk to the gate", seg: { label: "Walk", min: minutesBetween(cleared, gate) }, notes: r.gateNotes },
    { key: "spare", iso: gate, title: "Spare time", seg: { label: "Until boarding", min: minutesBetween(gate, boarding) }, notes: [] },
    { key: "boarding", iso: boarding, title: "Boarding starts", seg: { label: "Boarding to doors", min: minutesBetween(boarding, departure) }, notes: [] },
    { key: "departure", iso: departure, title: "Departure", notes: [] },
  ];
  const total = rows.reduce((s, row) => s + (row.seg?.min ?? 0), 0);

  // The line you can't cross: the later of no spare time and the bag cutoff, floored to a clean five.
  const anchor = new Date(plan.anchorISO).getTime();
  const bag = plan.bagLeaveISO ? new Date(plan.bagLeaveISO).getTime() : Infinity;
  const latestISO = new Date(Math.floor(Math.min(anchor, bag) / 300_000) * 300_000).toISOString();

  return { rows, total, latestISO };
}
