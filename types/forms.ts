export type DatePreset = "today" | "tomorrow" | "custom";

export interface FlightFormValues {
  flightNumber: string;
  datePreset: DatePreset;
  customDate: string;
  origin: string;
  hasPreCheck: boolean;
  hasClear: boolean;
  hasGlobalEntry: boolean;
  airportCode: string;
}

export interface OptionsFormValues {
  checkedBag: boolean;
  airlineStatus: string;
  hasTouchlessId: boolean;
  bufferMinutes: number;
}
