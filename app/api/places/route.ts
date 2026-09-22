import { NextRequest } from "next/server";

import { reverseGeocode, suggestPlaces } from "@/lib/route";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const near = Number.isFinite(lat) && Number.isFinite(lon) && params.get("lat") ? { lat, lon } : undefined;

  if (params.get("reverse") === "1" && near) {
    const label = await reverseGeocode(near);
    return Response.json({ label }, { headers: { "Cache-Control": "no-store" } });
  }

  const q = params.get("q") ?? "";
  const results = await suggestPlaces(q, near);
  return Response.json({ results }, { headers: { "Cache-Control": "no-store" } });
}
