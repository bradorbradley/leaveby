"use client";

import { format } from "date-fns";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

import { Breakdown } from "@/components/Breakdown";
import { BufferSlider } from "@/components/BufferSlider";
import { FlightSummaryCard } from "@/components/FlightSummaryCard";
import { PeakDayBadge } from "@/components/PeakDayBadge";
import { ProTip } from "@/components/ProTip";
import { ShareButton } from "@/components/ShareButton";
import { TimeReveal } from "@/components/TimeReveal";
import { Button } from "@/components/ui/button";
import { useLeaveTimeCalculation } from "@/hooks/useLeaveTimeCalculation";
import type { CalculationResult } from "@/types/calculation";

export function ResultsScreen({
  result,
  onBack,
}: {
  result: CalculationResult;
  onBack: () => void;
}) {
  const [bufferMinutes, setBufferMinutes] = useState(result.targetBufferMinutes);
  const liveLeaveTime = useLeaveTimeCalculation(result, bufferMinutes);

  useEffect(() => {
    setBufferMinutes(result.targetBufferMinutes);
  }, [result.targetBufferMinutes]);

  const shareText = `Leave by ${format(liveLeaveTime ?? new Date(result.leaveByTime), "h:mmaaa").toLowerCase()} for ${result.flight.flightNumber}${result.flight.destinationAirportCode ? ` to ${result.flight.destinationAirportCode}` : ""} (${bufferMinutes} min buffer).`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <Button variant="ghost" size="sm" className="w-fit" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Start over
      </Button>

      <section className="glass-card hero-noise relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
        <div className="relative z-10 space-y-6 text-center">
          <TimeReveal isoTime={(liveLeaveTime ?? new Date(result.leaveByTime)).toISOString()} isLate={result.isLate} />
          <BufferSlider value={bufferMinutes} onChange={setBufferMinutes} />
          {result.peakDayLabel ? <PeakDayBadge label={result.peakDayLabel} /> : null}
          {result.isLate ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm text-accent">
              <AlertTriangle className="h-4 w-4" />
              You are already inside the comfort window. Leave now.
            </div>
          ) : null}
        </div>
      </section>

      <FlightSummaryCard flight={result.flight} />

      <Breakdown items={rewriteBufferItem(result.breakdown, bufferMinutes)} />

      {result.warnings.length ? (
        <section className="glass-card space-y-3 p-5 sm:p-6">
          <p className="section-label">Important Notes</p>
          <div className="space-y-2">
            {result.warnings.map((warning) => (
              <div key={warning} className="rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
                {warning}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {result.proTips.length ? (
        <div className="space-y-3">
          {result.proTips.map((tip) => (
            <ProTip key={tip} text={tip} />
          ))}
        </div>
      ) : null}

      <div className="flex justify-center">
        <ShareButton text={shareText} />
      </div>
    </div>
  );
}

function rewriteBufferItem(items: CalculationResult["breakdown"], bufferMinutes: number) {
  return items.map((item) =>
    item.id === "buffer"
      ? {
          ...item,
          minutes: bufferMinutes,
          detail: `You asked for ${bufferMinutes} minutes after clearing security before boarding begins.`,
        }
      : item,
  );
}
