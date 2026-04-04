export interface TravelEstimate {
  durationMinutes: number;
  routeSummary: string;
  trafficSummary: string;
  incidents: string[];
  constructionBufferMinutes: number;
  source: string;
}
