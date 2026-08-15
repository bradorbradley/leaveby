import { NextRequest } from "next/server";

import { agentAvailable, researchLeavePlan } from "@/lib/agent";
import { calculateLeaveByTime } from "@/lib/calculator";
import { fetchFlightInfo } from "@/lib/scrapers/flight";
import { fetchSecurityWaitTime } from "@/lib/scrapers/security";
import { fetchTravelTime } from "@/lib/scrapers/traffic";
import { fetchWeather } from "@/lib/scrapers/weather";
import type { CalculationOptions } from "@/types/calculation";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    flightNumber: string;
    date: string;
    origin: string;
    options: CalculationOptions;
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      };

      try {
        send({ step: "flight", status: "loading" });
        const flight = await fetchFlightInfo(body.flightNumber, body.date);
        send({ step: "flight", status: "done", data: flight });

        send({ step: "traffic", status: "loading" });
        const traffic = await fetchTravelTime(body.origin, flight, body.options.mode ?? "drive");
        send({ step: "traffic", status: "done", data: traffic });

        send({ step: "weather", status: "loading" });
        const weather = await fetchWeather(flight);
        send({ step: "weather", status: "done", data: weather });

        // The real thinking: ask Claude to research this specific trip live.
        // Falls back to the deterministic model if no API key or on failure.
        let result = null;
        if (agentAvailable()) {
          send({ step: "research", status: "loading" });
          result = await researchLeavePlan({
            flight,
            traffic,
            weather,
            options: body.options,
            originLabel: body.origin,
          });
          if (result) {
            send({ step: "research", status: "done" });
          }
        }

        if (!result) {
          send({ step: "research", status: "loading" });
          const security = await fetchSecurityWaitTime(
            flight.departureAirport,
            flight.terminal,
            new Date(flight.departureTime),
            body.options,
            flight.departureTimezone,
          );
          send({ step: "research", status: "done", data: security });

          send({ step: "calculating", status: "loading" });
          result = calculateLeaveByTime({
            flight,
            traffic,
            security,
            weather,
            options: body.options,
          });
        } else {
          send({ step: "calculating", status: "loading" });
        }

        send({ step: "done", result });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to calculate right now.";
        send({ step: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
