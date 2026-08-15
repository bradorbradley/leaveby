import type { TravelMode } from "@/types/forms";

export interface TravelEstimate {
  durationMinutes: number;
  mode: TravelMode;
  routeSummary: string;
  trafficSummary: string;
  incidents: string[];
  constructionBufferMinutes: number;
  source: string;
}
