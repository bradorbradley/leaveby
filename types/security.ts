export interface SecurityEstimate {
  terminal: string | null;
  airportCode: string;
  baseWaitMinutes: number;
  adjustedWaitMinutes: number;
  confidence: "live" | "estimated" | "fallback";
  sourceNotes: string[];
  usedSources: string[];
}
