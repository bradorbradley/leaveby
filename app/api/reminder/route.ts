import { NextRequest } from "next/server";

export const runtime = "nodejs";

function icsDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/**
 * A calendar event at the leave time with alerts 15 minutes before and at
 * the moment. iOS opens it straight into the Add to Calendar sheet.
 */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const leave = p.get("leave") ?? "";
  if (Number.isNaN(new Date(leave).getTime())) return new Response("leave (ISO) required", { status: 400 });
  const flight = p.get("flight") ?? "your flight";
  const place = p.get("place") ?? "the airport";
  const url = p.get("url") ?? "";
  const start = new Date(leave);
  const end = new Date(start.getTime() + 10 * 60_000);
  const uid = `${start.getTime()}-${flight.replace(/\s+/g, "")}@leaveby`;
  const summary = `Leave for ${place} (${flight})`;
  const description = `Leave By: walk out the door now for ${flight}.${url ? `\n${url}` : ""}`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Leave By//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(start.toISOString())}`,
    `DTEND:${icsDate(end.toISOString())}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `LOCATION:${escapeText(place)}`,
    url ? `URL:${url}` : "",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Leave in 15 minutes",
    "TRIGGER:-PT15M",
    "END:VALARM",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Time to leave",
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="leave-by.ics"',
      "Cache-Control": "no-store",
    },
  });
}
