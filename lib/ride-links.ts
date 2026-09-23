import type { PlanRequest, PlanResult } from "@/types/plan";

function terminalLabel(result: PlanResult) {
  const f = result.flight;
  return f.terminal ? `${f.departureAirport} Terminal ${f.terminal}` : `${f.departureAirport} Airport`;
}

function destinationQuery(result: PlanResult) {
  const f = result.flight;
  const name = f.departureAirportName ?? `${f.departureAirport} Airport`;
  return f.terminal ? `${name} Terminal ${f.terminal}` : name;
}

/** Uber and Lyft deep links only take pickup and dropoff; neither accepts a scheduled time. */
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

export function googleMapsLink(result: PlanResult, mode: "driving" | "transit") {
  const params = new URLSearchParams({ api: "1", destination: destinationQuery(result), travelmode: mode });
  const o = result.route.originCoord;
  if (o) params.set("origin", `${o.lat},${o.lon}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function appleMapsLink(result: PlanResult, mode: "driving" | "transit") {
  const params = new URLSearchParams({ daddr: destinationQuery(result), dirflg: mode === "transit" ? "r" : "d" });
  const o = result.route.originCoord;
  if (o) params.set("saddr", `${o.lat},${o.lon}`);
  return `https://maps.apple.com/?${params.toString()}`;
}

export function flightStatusLink(result: PlanResult) {
  const f = result.flight;
  return `https://www.google.com/search?q=${encodeURIComponent(`${f.flightNumber} flight status`)}`;
}

export function airlineLogoUrl(airlineCode: string) {
  return `https://pics.avs.io/64/64/${encodeURIComponent(airlineCode)}.png`;
}

/** Calendar event with alerts, served as .ics so iOS opens the Add to Calendar sheet. */
export function reminderLink(result: PlanResult, leaveISO: string, planUrl: string) {
  const params = new URLSearchParams({ leave: leaveISO, flight: result.flight.flightNumber, place: terminalLabel(result) });
  if (planUrl) params.set("url", planUrl);
  return `/api/reminder?${params.toString()}`;
}

export function shareText(result: PlanResult, leaveLabel: string, bufferMinutes: number, planUrl: string) {
  const f = result.flight;
  return `For your flight ${f.flightNumber} you need to leave by ${leaveLabel} to get through security with ${bufferMinutes} min to spare before boarding. Check it on Leave By: ${planUrl}`;
}

/** Encode the inputs into a shareable URL that reopens this exact plan. */
export function planQuery(request: PlanRequest): string {
  const p = new URLSearchParams();
  p.set("f", request.flightNumber);
  p.set("d", request.date);
  if (request.origin?.label) p.set("o", request.origin.label);
  if (typeof request.origin?.lat === "number" && typeof request.origin?.lon === "number") {
    p.set("lat", request.origin.lat.toFixed(5));
    p.set("lon", request.origin.lon.toFixed(5));
  } else if (request.origin?.text) p.set("o", request.origin.text);
  p.set("bag", request.checkedBag ? "1" : "0");
  const perks = [request.perks.precheck && "pre", request.perks.clear && "clear", request.perks.globalEntry && "ge", request.perks.touchlessId && "tid"].filter(Boolean);
  if (perks.length) p.set("p", perks.join(","));
  p.set("b", String(request.bufferMinutes));
  if (request.mode && request.mode !== "ride") p.set("m", request.mode);
  return p.toString();
}

export function parsePlanQuery(search: string): PlanRequest | null {
  const p = new URLSearchParams(search);
  const flightNumber = p.get("f")?.trim().toUpperCase() ?? "";
  const date = p.get("d") ?? "";
  if (!flightNumber || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const lat = Number(p.get("lat"));
  const lon = Number(p.get("lon"));
  const label = p.get("o") ?? undefined;
  const origin = Number.isFinite(lat) && Number.isFinite(lon) && p.get("lat") ? { label: label ?? "Saved spot", lat, lon } : label ? { text: label, label } : null;
  const perks = (p.get("p") ?? "").split(",");
  const m = p.get("m");
  return {
    flightNumber,
    date,
    origin,
    checkedBag: p.get("bag") === "1",
    perks: { precheck: perks.includes("pre"), clear: perks.includes("clear"), globalEntry: perks.includes("ge"), touchlessId: perks.includes("tid") },
    bufferMinutes: Math.min(120, Math.max(10, Number(p.get("b")) || 30)),
    mode: m === "drive" || m === "transit" ? m : "ride",
  };
}
