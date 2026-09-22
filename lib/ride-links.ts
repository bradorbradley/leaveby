import type { PlanResult } from "@/types/plan";

function terminalLabel(result: PlanResult) {
  const f = result.flight;
  return f.terminal ? `${f.departureAirport} Terminal ${f.terminal}` : `${f.departureAirport} Airport`;
}

function destinationQuery(result: PlanResult) {
  const f = result.flight;
  const name = f.departureAirportName ?? `${f.departureAirport} Airport`;
  return f.terminal ? `${name} Terminal ${f.terminal}` : name;
}

export function uberLink(result: PlanResult) {
  const coord = result.flight.airportCoord;
  const params = new URLSearchParams({ action: "setPickup", pickup: "my_location", "dropoff[formatted_address]": destinationQuery(result) });
  if (coord) {
    params.set("dropoff[latitude]", String(coord.lat));
    params.set("dropoff[longitude]", String(coord.lon));
  }
  params.set("dropoff[nickname]", terminalLabel(result));
  return `https://m.uber.com/ul/?${params.toString()}`;
}

export function lyftLink(result: PlanResult) {
  const coord = result.flight.airportCoord;
  const params = new URLSearchParams({ id: "lyft" });
  if (coord) {
    params.set("destination[latitude]", String(coord.lat));
    params.set("destination[longitude]", String(coord.lon));
  }
  return `https://lyft.com/ride?${params.toString()}`;
}

export function mapsLink(result: PlanResult) {
  const params = new URLSearchParams({ api: "1", destination: destinationQuery(result), travelmode: "driving" });
  const o = result.route.originCoord;
  if (o) params.set("origin", `${o.lat},${o.lon}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function calDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function calendarLink(result: PlanResult, leaveISO: string) {
  const f = result.flight;
  const end = new Date(new Date(leaveISO).getTime() + 15 * 60_000).toISOString();
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Leave for ${terminalLabel(result)} (${f.flightNumber})`,
    dates: `${calDate(leaveISO)}/${calDate(end)}`,
    details: `Leave By says walk out the door now. ${f.flightNumber} departs ${f.departureLocalLabel ?? ""}.`,
    location: destinationQuery(result),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function shareText(result: PlanResult, leaveLabel: string) {
  const f = result.flight;
  return `Leave by ${leaveLabel} for ${f.flightNumber} from ${terminalLabel(result)}. From Leave By.`;
}
