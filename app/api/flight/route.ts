import { NextRequest } from "next/server";

import { liveLeg } from "@/lib/resolve-flight";
import { faaAlerts } from "@/lib/scrapers/faa";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Live status for the reveal screen: the exact departure the plan was built on (airport and time), nothing else. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const flightNumber = params.get("flight") ?? "";
  const date = params.get("date") ?? "";
  const airport = (params.get("airport") ?? "").toUpperCase();
  const time = params.get("time");
  if (!flightNumber || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^[A-Z]{3}$/.test(airport)) {
    return Response.json({ error: "flight, date and airport required" }, { status: 400 });
  }
  const leg = await liveLeg(flightNumber, date, airport, time).catch(() => null);
  if (!leg) return Response.json({ error: "not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const scheduled = new Date(leg.scheduledISO).getTime();
  const estimated = leg.estimatedISO ? new Date(leg.estimatedISO).getTime() : scheduled;
  const delayMinutes = Math.max(0, Math.round((estimated - scheduled) / 60000));
  const departureTime = new Date(Math.max(scheduled, estimated)).toISOString();
  const airportAlerts = await faaAlerts(leg.airport, leg.destination ?? undefined, departureTime).catch((): string[] => []);
  return Response.json(
    {
      airportAlerts,
      status: leg.cancelled ? "cancelled" : delayMinutes > 0 ? "delayed" : "scheduled",
      delayMinutes,
      gate: leg.gate,
      terminal: leg.terminal,
      departureTime,
      source: leg.source,
      checkedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
