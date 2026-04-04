import { NextRequest } from "next/server";

import { calculateLeaveByTime } from "@/lib/calculator";
import { searchFlightDetails } from "@/lib/search";
import type { AirportCode } from "@/types/airport";
import type { CalculationOptions } from "@/types/calculation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    flightNumber: string;
    date: string;
    airportCode: AirportCode;
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
        send({ step: "searching", status: "loading" });
        const { flight, traffic, security, weather } = await searchFlightDetails(body);
        send({ step: "searching", status: "done", data: { flight, traffic, security, weather } });

        send({ step: "calculating", status: "loading" });
        const result = calculateLeaveByTime({
          flight,
          traffic,
          security,
          weather,
          options: body.options,
        });

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
