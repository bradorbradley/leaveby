export type WeatherKind = "rain" | "heavy-rain" | "storm" | "snow" | "ice" | "fog" | "wind";

export interface WeatherEstimate {
  summary: string;
  impact: "none" | "minor" | "moderate" | "severe";
  notes: string[];
  source: string;
  /** The worst weather in the trip window (a few hours before departure through departure). */
  kind?: WeatherKind | null;
  /** When it peaks, so the note can say "around 6 AM". */
  peakISO?: string | null;
  /** Chance of precipitation at the peak, 0-100, when the source gives one. */
  chance?: number | null;
  /** Official alerts in effect (NWS), e.g. "Winter Storm Warning". */
  alerts?: string[];
}

/** What the plan carries to the screen. */
export interface WeatherBrief {
  kind: WeatherKind;
  label: string;
  chance: number | null;
  peakISO: string | null;
  extraMinutes: number;
}
