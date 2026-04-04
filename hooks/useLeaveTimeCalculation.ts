"use client";

import { useMemo } from "react";
import { parseISO, subMinutes } from "date-fns";

import type { CalculationResult } from "@/types/calculation";

export function useLeaveTimeCalculation(result: CalculationResult | null, bufferMinutes: number) {
  return useMemo(() => {
    if (!result) return null;
    const boarding = parseISO(result.boardingTime);
    return subMinutes(boarding, result.airportArrivalMinutes + result.travelMinutes + bufferMinutes);
  }, [bufferMinutes, result]);
}
