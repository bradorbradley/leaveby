export type DatePreset = "today" | "tomorrow" | "custom";

export type TravelMode = "drive" | "rideshare" | "transit";

export interface LeaveByFormValues {
  flightNumber: string;
  datePreset: DatePreset;
  customDate: string;
  origin: string;
  mode: TravelMode;
  checkedBag: boolean;
  hasPreCheck: boolean;
  hasClear: boolean;
  hasGlobalEntry: boolean;
  bufferMinutes: number;
}
