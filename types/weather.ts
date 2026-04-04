export interface WeatherEstimate {
  summary: string;
  impact: "none" | "minor" | "moderate" | "severe";
  notes: string[];
  source: string;
}
