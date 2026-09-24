import { NextRequest } from "next/server";

import { computePlan } from "@/lib/plan-math";
import { researchTrip } from "@/lib/research";
import { FlightNotFoundError, resolveFlight } from "@/lib/resolve-flight";
import { estimateRoute } from "@/lib/route";
import { faaAlerts } from "@/lib/scrapers/faa";
import { fetchWeather } from "@/lib/scrapers/weather";
import { resolveTerminalCoord } from "@/lib/terminal-coord";
import type { PlanEvent, PlanRequest } from "@/types/plan";
import type { WeatherEstimate } from "@/types/weather";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  let body: PlanRequest;
  try {
    body = (await request.json()) as PlanRequest;
  } catch {
    return new Response(JSON.stringify({ type: "error", message: "Bad request" }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: PlanEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        if (!body.flightNumber?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(body.date ?? "")) {
          send({ type: "error", message: "Enter a flight number and a date." });
          return;
        }

        let flight;
        try {
          flight = await resolveFlight(body.flightNumber, body.date, body.manual);
        } catch (error) {
          if (error instanceof FlightNotFoundError) {
            send({ type: "flight_notfound", message: error.message });
            return;
          }
          throw error;
        }
        send({ type: "flight", flight });

        const departureMs = new Date(flight.departureTime).getTime();
        if (departureMs < Date.now() - 30 * 60_000) {
          send({ type: "error", message: `${flight.flightNumber} already departed on that date. Check the date.` });
          return;
        }
        if (flight.status === "cancelled") {
          send({ type: "error", message: `${flight.flightNumber} shows as cancelled for that date.` });
          return;
        }

        const [route, weather, terminalCoord, airportAlerts] = await Promise.all([
          estimateRoute(body.origin ?? null, flight),
          fetchWeather(flight).catch((): WeatherEstimate | null => null),
          resolveTerminalCoord(flight).catch(() => null),
          faaAlerts(flight.departureAirport, flight.destinationAirportCode, flight.departureTime).catch((): string[] => []),
        ]);
        flight = { ...flight, terminalCoord };
        send({ type: "route", route });

        const perks = {
          precheck: Boolean(body.perks?.precheck),
          clear: Boolean(body.perks?.clear),
          globalEntry: Boolean(body.perks?.globalEntry),
          touchlessId: Boolean(body.perks?.touchlessId),
        };
        const mode = body.mode === "drive" || body.mode === "transit" ? body.mode : "ride";
        const researched = await researchTrip({
          flight,
          route,
          weather,
          checkedBag: Boolean(body.checkedBag),
          perks,
          mode,
          onSearch: (query) => send({ type: "search", query }),
          onStage: (stage) => send({ type: "stage", stage }),
          onNote: (text) => send({ type: "note", text }),
        });
        const research = { ...researched, airportAlerts };

        const bufferMinutes = Math.min(120, Math.max(0, Math.round(Number(body.bufferMinutes) || 30)));
        const result = computePlan({ flight, route, research, bufferMinutes, checkedBag: Boolean(body.checkedBag), mode });
        send({ type: "result", result });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Something went wrong.";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
