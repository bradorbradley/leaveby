import { worldAirport } from "@/lib/airports/world";

/**
 * What stands between security and the gate on an international trip, by rule rather than
 * by guess: exit passport control, US preclearance, and whether US programs like TSA PreCheck
 * and CLEAR exist at the departure airport at all. Live research refines the minutes.
 */

/** US territories screen with TSA and fly to the mainland as domestic flights. */
const US_TERRITORIES = new Set(["US", "PR", "GU", "VI", "AS", "MP"]);

/** Schengen members: flights among them have no passport control. */
const SCHENGEN = new Set([
  "AT", "BE", "BG", "CH", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IS", "IT",
  "LI", "LT", "LU", "LV", "MT", "NL", "NO", "PL", "PT", "RO", "SE", "SI", "SK",
]);

/** Countries that don't run exit passport control for departing passengers (the airline checks documents). */
const NO_EXIT_CONTROL = new Set(["US", "CA", "GB", "IE", "MX"]);

/** Airports where US Customs and Border Protection clears US-bound passengers before departure. */
const US_PRECLEARANCE = new Set(["YYZ", "YVR", "YUL", "YYC", "YEG", "YOW", "YWG", "YHZ", "DUB", "SNN", "AUA", "NAS", "FPO", "BDA", "AUH"]);

export function countryOf(airportCode: string | null | undefined): string | null {
  const country = worldAirport(airportCode)?.country ?? null;
  return country && US_TERRITORIES.has(country) ? "US" : country;
}

/** TSA PreCheck, CLEAR and Touchless ID lanes exist only at US airports. */
export function usScreening(airportCode: string | null | undefined): boolean {
  return countryOf(airportCode) === "US";
}

export interface BorderStep {
  kind: "none" | "exit" | "preclearance";
  /** Shown as the step's title, e.g. "Passport control". */
  label: string;
  /** Typical minutes when live research has nothing. */
  baselineMinutes: number;
  /** The destination is the US and the departure isn't: US-bound flights often get extra screening abroad. */
  usBound: boolean;
  /** Leaving the Schengen area, where the EU Entry/Exit System now takes biometrics from non-EU travelers on exit. */
  schengenExit: boolean;
  fromCountry: string | null;
  toCountry: string | null;
}

export function borderStep(from: string | null | undefined, to: string | null | undefined): BorderStep {
  const fromCountry = countryOf(from);
  const toCountry = countryOf(to);
  const usBound = toCountry === "US" && fromCountry !== null && fromCountry !== "US";
  const schengenExit = Boolean(fromCountry && SCHENGEN.has(fromCountry) && !(toCountry && SCHENGEN.has(toCountry)));
  const base = { usBound, schengenExit, fromCountry, toCountry };
  if (!fromCountry || !toCountry || fromCountry === toCountry) return { ...base, kind: "none", label: "", baselineMinutes: 0 };
  if (usBound && from && US_PRECLEARANCE.has(from.toUpperCase())) {
    return { ...base, kind: "preclearance", label: "US preclearance", baselineMinutes: 45 };
  }
  if (SCHENGEN.has(fromCountry) && SCHENGEN.has(toCountry)) return { ...base, kind: "none", label: "", baselineMinutes: 0 };
  if (NO_EXIT_CONTROL.has(fromCountry)) return { ...base, kind: "none", label: "", baselineMinutes: 0 };
  // Exit checks under the EU Entry/Exit System are slower than the old passport stamp.
  return { ...base, kind: "exit", label: "Passport control", baselineMinutes: schengenExit ? 30 : 15 };
}

const COUNTRY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });
export function countryName(code: string | null): string {
  if (!code) return "abroad";
  try {
    return code === "US" ? "the US" : (COUNTRY_NAMES.of(code) ?? code);
  } catch {
    return code;
  }
}
