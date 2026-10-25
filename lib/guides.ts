import guides from "@/lib/airports/guides.json";
import { worldAirport } from "@/lib/airports/world";
import { haversineKm } from "@/lib/flight-legs";

/**
 * Researched departure guides for the busiest US airports, with sources. They power the public
 * /airports pages. Every fact comes from a cited page; unknowns are null, never guessed.
 */
export interface GuideCheckpoint {
  name: string;
  precheck: boolean | null;
  clear: boolean | null;
  notes: string | null;
}

export interface GuideTerminal {
  id: string;
  name: string;
  airlines: string[];
  checkpoints: GuideCheckpoint[];
  notes: string[];
}

export interface AirportGuide {
  code: string;
  /** "intl" for airports abroad: no TSA, and an exit passport-control section instead. */
  region?: "us" | "intl";
  name: string;
  city: string;
  state: string;
  checkedOn: string;
  officialArrivalAdvice: { domestic: string | null; international: string | null; source: string | null };
  terminals: GuideTerminal[];
  connectedAirside: boolean | null;
  betweenTerminals: string | null;
  securityWaits: { summary: string | null; busiestTimes: string[]; source: string | null };
  precheckNotes: string | null;
  clearAvailable: boolean | null;
  touchlessId: string | null;
  gettingThere: { rideshare: string | null; transit: string | null; driving: string | null };
  construction2026: string[];
  bagDrop: string | null;
  /** Exit border control for a US traveler flying home (international guides only). */
  passportControl?: string | null;
  tips: string[];
  faq: Array<{ q: string; a: string }>;
  sources: Array<{ title: string; url: string }>;
}

const all = guides as unknown as Record<string, AirportGuide>;

export function guideCodes(): string[] {
  return Object.keys(all).sort();
}

export function getGuide(code: string): AirportGuide | null {
  return all[code.toUpperCase()] ?? null;
}

export function allGuides(): AirportGuide[] {
  return guideCodes().map((c) => all[c]);
}

export const isIntl = (g: AirportGuide) => g.region === "intl";

/** "Sep 26, 2026" from "2026-09-26". */
export function prettyChecked(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** Other guided airports within `maxKm`, nearest first: JFK → LGA, EWR. Server only (reads the world table). */
export function nearbyGuides(code: string, maxKm = 120, limit = 3): Array<{ guide: AirportGuide; km: number }> {
  const here = worldAirport(code);
  if (!here) return [];
  return allGuides()
    .filter((g) => g.code !== here.code)
    .map((g) => {
      const there = worldAirport(g.code);
      return { guide: g, km: there ? haversineKm(here, there) : Infinity };
    })
    .filter((n) => n.km <= maxKm)
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}
