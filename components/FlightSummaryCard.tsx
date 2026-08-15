import { format } from "date-fns";
import { PlaneTakeoff } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { FlightInfo } from "@/types/flight";

export function FlightSummaryCard({ flight }: { flight: FlightInfo }) {
  return (
    <Card className="border-primary/10 bg-primary/[0.03]">
      <CardContent className="flex items-start gap-3 p-5">
        <div className="rounded-2xl bg-primary p-2.5 text-primary-foreground">
          <PlaneTakeoff className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Your flight</p>
          <h3 className="text-lg font-semibold text-primary">
            {flight.flightNumber}
            {flight.destinationAirportCode ? ` to ${flight.destinationAirportCode}` : ""}
          </h3>
          <p className="text-sm text-muted-foreground">
            Departs {flight.departureLocalLabel ?? format(new Date(flight.departureTime), "EEE, MMM d • h:mmaaa")} •{" "}
            {flight.terminal ? `Terminal ${flight.terminal}` : "Terminal pending"}
            {flight.gate ? ` • Gate ${flight.gate}` : ""}
          </p>
          {flight.status === "delayed" && flight.delayMinutes > 0 ? (
            <p className="text-sm font-medium text-accent">Running about {flight.delayMinutes} min late</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
