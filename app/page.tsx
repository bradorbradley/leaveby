import type { Metadata } from "next";

import { HomeClient } from "@/components/HomeClient";
import { fmtDay, fmtTimeShort } from "@/lib/format";
import { decodeSharedPlanServer } from "@/lib/share-payload.server";

export const dynamic = "force-dynamic";

/** Absolute origin for share cards: explicit override, else the domain Vercel serves production on (custom domain once attached), else the default. */
const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://leaveby.vercel.app");

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Per-plan Open Graph tags so a shared link previews the time and flight. */
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams;
  const p = typeof params.p === "string" ? params.p : null;
  const shared = p ? decodeSharedPlanServer(p) : null;

  if (!shared) {
    return {
      title: "Leave By",
      description: "Tell it your flight. It tells you when to walk out the door.",
      metadataBase: new URL(SITE),
      openGraph: { title: "Leave By", description: "Tell it your flight. It tells you when to walk out the door.", images: ["/api/og"], type: "website" },
      twitter: { card: "summary_large_image", title: "Leave By", description: "Tell it your flight. It tells you when to walk out the door.", images: ["/api/og"] },
    };
  }

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

export default function Page() {
  return <HomeClient />;
}
