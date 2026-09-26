import { NextRequest } from "next/server";

import { FlightNotFoundError, flightOptions } from "@/lib/resolve-flight";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Every departure of a flight number on a date, for the traveler to pick from as they type. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const flight = params.get("flight") ?? "";
  const date = params.get("date") ?? "";
  if (!flight.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return Response.json({ error: "flight and date required" }, { status: 400 });
  try {
    const result = await flightOptions(flight, date);
    if (result.status === "unavailable") console.warn(`[options] schedules unreachable for ${result.flightNumber} ${date}`);
    // Share answers across travelers for a few minutes so schedule sources aren't hammered; never cache a failure long.
    const cacheControl = result.status === "unavailable" ? "no-store" : "public, s-maxage=180, stale-while-revalidate=600";
    return Response.json(result, { headers: { "Cache-Control": cacheControl } });
  } catch (error) {
    if (error instanceof FlightNotFoundError) return Response.json({ error: error.message }, { status: 400 });
    console.warn("[options] failed:", error instanceof Error ? error.message : error);
    return Response.json({ error: "lookup failed" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
