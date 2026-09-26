import { airlineNameFromIata } from "@/lib/airline-codes";
import { detectAirportTerminalByAirline, getAirlineProfile } from "@/lib/airports";
import { worldAirport } from "@/lib/airports/world";
import { fetchSchedule, type Leg } from "@/lib/flight-legs";
import { parseFlightNumber } from "@/lib/flight-utils";
import { formatInZone, zonedTimeToUtcISO } from "@/lib/tz";
import type { FlightInfo, FlightOption, FlightOptions } from "@/types/flight";
import type { LegChoice, PlanRequest } from "@/types/plan";

export class FlightNotFoundError extends Error {
  constructor(message = "We couldn't find that flight.") {
    super(message);
    this.name = "FlightNotFoundError";
  }
}

/** A schedule leg matches the traveler's choice if it leaves their airport within this long of their time. */
const MATCH_WINDOW_MIN = 90;

type Parsed = NonNullable<ReturnType<typeof parseFlightNumber>>;

function airlineName(parsed: Parsed) {
  return getAirlineProfile(parsed.airlineCode)?.name ?? airlineNameFromIata(parsed.airlineCode) ?? parsed.airlineName;
}

/**
 * Every departure this flight number makes on the date, for the traveler to choose from.
 * Never picks one for them. When the date is beyond what schedules publish, returns the
 * routes it usually flies with their usual times, marked `exact: false`, for the traveler
 * to confirm the time.
 */
export async function flightOptions(flightNumber: string, date: string, now = new Date()): Promise<FlightOptions> {
  const parsed = parseFlightNumber(flightNumber);
  if (!parsed) throw new FlightNotFoundError("That doesn't look like a flight number. Try DL 405.");
  const base = { flightNumber: parsed.normalized, airlineName: airlineName(parsed), date };
  const schedule = await fetchSchedule(parsed.airlineCode, parsed.flightDigits);

  if (!schedule.reached.length) return { ...base, status: "unavailable", options: [] };

  const onDate = schedule.legs.filter((l) => l.localDate === date);
  if (onDate.length) {
    return { ...base, status: "exact", options: onDate.map((l) => toOption(l, true, now)) };
  }
  if (schedule.coveredDates.includes(date)) return { ...base, status: "not_operating", options: [] };
  if (!schedule.legs.length) return { ...base, status: "not_found", options: [] };

  // Beyond the published window: each route it flies, at its most recent time.
  const latest = new Map<string, Leg>();
  for (const leg of schedule.legs) {
    const key = `${leg.airport}>${leg.destination ?? ""}`;
    const seen = latest.get(key);
    if (!seen || leg.scheduledISO > seen.scheduledISO) latest.set(key, leg);
  }
  const options = [...latest.values()].map((l) => toOption(l, false, now)).sort((a, b) => a.time.localeCompare(b.time));
  return { ...base, status: "typical", options };
}

function toOption(leg: Leg, exact: boolean, now: Date): FlightOption {
  const departed = exact && new Date(leg.estimatedISO ?? leg.scheduledISO).getTime() < now.getTime();
  return {
    id: `${leg.airport}-${leg.destination ?? "x"}-${leg.localTime}`,
    airport: leg.airport,
    airportName: leg.airportName,
    city: leg.city,
    destination: leg.destination,
    destinationCity: leg.destinationCity,
    time: leg.localTime,
    departureISO: exact ? leg.scheduledISO : null,
    terminal: exact ? leg.terminal : null,
    exact,
    departed,
    cancelled: exact && leg.cancelled,
  };
}

/**
 * The flight the traveler chose: their airport and time, enriched with live schedule details
 * (terminal, gate, delay) when a schedule leg matches. The airport is never swapped for another.
 */
export async function resolveLeg(flightNumber: string, date: string, choice: LegChoice): Promise<FlightInfo> {
  const parsed = parseFlightNumber(flightNumber);
  if (!parsed) throw new FlightNotFoundError("That doesn't look like a flight number. Try DL 405.");
  const code = (choice.airport ?? "").trim().toUpperCase();
  const airport = worldAirport(code);
  if (!airport) throw new FlightNotFoundError(`We don't recognize the airport code "${code}". Use the 3-letter code on your ticket, like SFO.`);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(choice.time ?? "")) throw new FlightNotFoundError("Enter your departure time.");

  const scheduledISO = zonedTimeToUtcISO(date, choice.time, airport.timezone);
  const base = {
    flightNumber: parsed.normalized,
    airlineCode: parsed.airlineCode,
    airlineName: airlineName(parsed),
  };

  const schedule = await fetchSchedule(parsed.airlineCode, parsed.flightDigits).catch(() => null);
  const match = schedule ? matchLeg(schedule.legs, code, date, scheduledISO) : null;
  if (match) return fromLeg(base, match, choice);

  // The schedule has this flight leaving their airport that day, but not near their time: say so.
  const elsewhen = schedule?.legs.filter((l) => l.airport === code && l.localDate === date) ?? [];
  const mismatch = elsewhen.length
    ? [`The live schedule shows ${parsed.normalized} leaving ${code} at ${elsewhen.map((l) => clock(l.localTime)).join(" and ")} that day. We used the time you entered, ${clock(choice.time)}.`]
    : [];

  const destination = choice.destination?.toUpperCase() || null;
  const destinationAirport = worldAirport(destination);
  const typical = choice.confirmed === "schedule";
  return {
    ...base,
    departureAirport: code,
    departureAirportName: airport.name,
    departureTimezone: airport.timezone,
    airportCoord: { lat: airport.lat, lon: airport.lon },
    destinationAirportCode: destination ?? undefined,
    destinationCity: destinationAirport?.city ?? destination ?? undefined,
    departureTime: new Date(scheduledISO).toISOString(),
    departureLocalLabel: formatInZone(new Date(scheduledISO), airport.timezone),
    terminal: detectAirportTerminalByAirline(code, parsed.airlineCode),
    gate: null,
    status: "scheduled",
    delayMinutes: 0,
    region: destinationAirport && destinationAirport.country !== airport.country ? "international" : "domestic",
    source: typical ? "Usual schedule · time you confirmed" : "Airport and time you entered",
    notes: [
      ...mismatch,
      ...(typical ? ["The airline hasn't published this day's live schedule yet, so we planned from the time you confirmed. Check it again the day before you fly."] : []),
    ],
  };
}

/**
 * The departure to plan: the one the traveler picked or typed. Older share links carry only a
 * flight number; those plan only when the schedule has exactly one departure that day.
 */
export async function legForPlan(body: PlanRequest, now = new Date()): Promise<LegChoice | null> {
  const leg = body.leg;
  if (leg?.airport && leg.time) return { airport: leg.airport, time: leg.time, destination: leg.destination ?? null, confirmed: leg.confirmed === "schedule" ? "schedule" : "traveler" };
  if (body.manual?.airport && body.manual.departureTime) return { airport: body.manual.airport, time: body.manual.departureTime, confirmed: "traveler" };
  const options = await flightOptions(body.flightNumber, body.date, now);
  const open = options.status === "exact" ? options.options.filter((o) => !o.departed && !o.cancelled) : [];
  if (open.length !== 1 || options.options.length !== 1) return null;
  return { airport: open[0].airport, time: open[0].time, destination: open[0].destination, confirmed: "schedule" };
}

/** Live status for the leg a plan was built on, or null. Only ever the same airport. */
export async function liveLeg(flightNumber: string, date: string, airportCode: string, time?: string | null): Promise<Leg | null> {
  const parsed = parseFlightNumber(flightNumber);
  const airport = worldAirport(airportCode);
  if (!parsed || !airport) return null;
  const schedule = await fetchSchedule(parsed.airlineCode, parsed.flightDigits);
  const target = time && /^\d{2}:\d{2}$/.test(time) ? zonedTimeToUtcISO(date, time, airport.timezone) : null;
  const sameDay = schedule.legs.filter((l) => l.airport === airport.code && l.localDate === date);
  if (!target) return sameDay.length === 1 ? sameDay[0] : null;
  return matchLeg(schedule.legs, airport.code, date, target);
}

/** The schedule leg leaving this airport on this date closest to the chosen time, within the match window. */
export function matchLeg(legs: Leg[], airport: string, date: string, scheduledISO: string): Leg | null {
  const target = new Date(scheduledISO).getTime();
  let best: Leg | null = null;
  let bestGap = MATCH_WINDOW_MIN * 60_000;
  for (const leg of legs) {
    if (leg.airport !== airport || leg.localDate !== date) continue;
    const gap = Math.abs(new Date(leg.scheduledISO).getTime() - target);
    if (gap <= bestGap) {
      best = leg;
      bestGap = gap;
    }
  }
  return best;
}

function fromLeg(base: Pick<FlightInfo, "flightNumber" | "airlineCode" | "airlineName">, leg: Leg, choice: LegChoice): FlightInfo {
  const scheduled = new Date(leg.scheduledISO).getTime();
  const estimated = leg.estimatedISO ? new Date(leg.estimatedISO).getTime() : scheduled;
  const best = new Date(Math.max(scheduled, estimated));
  const delayMinutes = Math.max(0, Math.round((estimated - scheduled) / 60000));
  const origin = worldAirport(leg.airport);
  const destination = worldAirport(leg.destination ?? choice.destination);
  return {
    ...base,
    departureAirport: leg.airport,
    departureAirportName: leg.airportName ?? origin?.name,
    departureTimezone: leg.timezone,
    airportCoord: leg.coord ?? (origin ? { lat: origin.lat, lon: origin.lon } : undefined),
    destinationAirportCode: leg.destination ?? choice.destination ?? undefined,
    destinationCity: leg.destinationCity ?? destination?.city ?? undefined,
    departureTime: best.toISOString(),
    departureLocalLabel: formatInZone(best, leg.timezone),
    terminal: leg.terminal ?? detectAirportTerminalByAirline(leg.airport, base.airlineCode),
    gate: leg.gate,
    status: leg.cancelled ? "cancelled" : delayMinutes > 0 ? "delayed" : "scheduled",
    delayMinutes,
    region: origin && destination && origin.country !== destination.country ? "international" : "domestic",
    source: `${leg.source} · live schedule`,
    notes: [],
  };
}

/** "20:16" → "8:16 PM" */
function clock(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
