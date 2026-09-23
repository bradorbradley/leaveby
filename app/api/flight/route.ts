import { NextRequest } from "next/server";

import { resolveFlight } from "@/lib/resolve-flight";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Live flight status for the reveal screen. Cheap: one schedule scrape. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const flightNumber = params.get("flight") ?? "";
  const date = params.get("date") ?? "";
  if (!flightNumber || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return Response.json({ error: "flight and date required" }, { status: 400 });
  try {
    const f = await resolveFlight(flightNumber, date);
    return Response.json(
      {
        status: f.status,
        delayMinutes: f.delayMinutes,
        gate: f.gate,
        terminal: f.terminal,
        departureTime: f.departureTime,
        source: f.source,
        checkedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
}
