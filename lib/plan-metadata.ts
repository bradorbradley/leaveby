import type { Metadata } from "next";

import { fmtDay, fmtTimeShort } from "@/lib/format";
import { decodeSharedPlanServer } from "@/lib/share-payload.server";

/** Absolute origin for share cards and links: explicit override, else the canonical domain (the apex redirects here). */
export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.leaveby.xyz";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TAGLINE = "Never miss a flight again. Tell it your flight and it tells you exactly when to leave.";

export const appMetadata: Metadata = {
  title: "Leave By",
  description: TAGLINE,
  metadataBase: new URL(SITE),
  openGraph: { title: "Leave By", description: TAGLINE, images: ["/api/og"], type: "website" },
  twitter: { card: "summary_large_image", title: "Leave By", description: TAGLINE, images: ["/api/og"] },
};

const PITCH = "Never miss a flight again. Leave By finds the exact time you need to leave, based on your flight, your preferences, and live data on your commute.";

export const landingMetadata: Metadata = {
  title: "Leave By · Never miss a flight again",
  description: PITCH,
  metadataBase: new URL(SITE),
  openGraph: { title: "Leave By", description: PITCH, images: ["/api/og"], type: "website", url: "/" },
  twitter: { card: "summary_large_image", title: "Leave By", description: PITCH, images: ["/api/og"] },
};

/** Per-plan Open Graph tags so a shared link previews the time and flight. Falls back to the app's tags. */
export async function planMetadata(searchParams: SearchParams, fallback: Metadata = appMetadata): Promise<Metadata> {
  const params = await searchParams;
  const p = typeof params.p === "string" ? params.p : null;
  const shared = p ? decodeSharedPlanServer(p) : null;
  if (!shared) return fallback;

  const { result, request } = shared;
  const f = result.flight;
  const tz = f.departureTimezone ?? "America/New_York";
  const leave = fmtTimeShort(result.leaveISO, tz);
  const day = fmtDay(result.leaveISO, tz);
  const route = f.destinationAirportCode ? `${f.departureAirport} → ${f.destinationAirportCode}` : f.departureAirport;
  const title = `Leave by ${leave} · ${f.flightNumber}`;
  const description = `${day.pretty} · ${route} departs ${fmtTimeShort(f.departureTime, tz)}${f.terminal ? ` · Terminal ${f.terminal}` : ""} · ${request.bufferMinutes} min spare before boarding`;
  const og = new URLSearchParams({
    leave,
    day: day.pretty,
    flight: f.flightNumber,
    airline: f.airlineCode,
    route,
    dep: fmtTimeShort(f.departureTime, tz),
    terminal: f.terminal ?? "",
    spare: String(request.bufferMinutes),
  });
  const image = `/api/og?${og.toString()}`;

  return {
    title,
    description,
    metadataBase: new URL(SITE),
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630 }], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/** A URL carries a plan when it has a shared payload or the inputs to re-run one. */
export function hasPlanParams(params: Record<string, string | string[] | undefined>) {
  return typeof params.p === "string" || typeof params.f === "string";
}
