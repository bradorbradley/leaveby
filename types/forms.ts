export type DatePreset = "today" | "tomorrow" | "custom";

export interface LeaveByFormValues {
  flightNumber: string;
  datePreset: DatePreset;
  customDate: string;
  origin: string;
  checkedBag: boolean;
  hasPreCheck: boolean;
  hasClear: boolean;
  hasGlobalEntry: boolean;
  bufferMinutes: number;
}
