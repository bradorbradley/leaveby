"use client";

import * as React from "react";

export interface CalculationResult {
  leaveByTime: string;
  flight: {
    airline: string;
    number: string;
    destination: string;
    terminal: string;
    departureTime: string;
    isInternational: boolean;
  };
  breakdown: {
    travelMinutes: number;
    travelDescription: string;
    securityMinutes: number;
    securityDescription: string;
    airportBufferMinutes: number;
    airportBufferDescription: string;
  };
  totalMinutes: number;
  warnings: string[];
  tips: string[];
}

export interface CalculationInput {
  flightNumber: string;
  airport: string;
  date: Date;
  origin: string;
  hasPrecheck: boolean;
  hasClear: boolean;
  hasGlobalEntry: boolean;
  checkingBag: boolean;
  airlineStatus: string;
}

type CalcState =
  | { status: "idle" }
  | { status: "loading"; currentStep: string; completedSteps: string[] }
  | { status: "done"; result: CalculationResult }
  | { status: "error"; message: string };

export function useCalculation() {
  const [state, setState] = React.useState<CalcState>({ status: "idle" });

  const calculate = React.useCallback(async (input: CalculationInput) => {
    setState({ status: "loading", currentStep: "flight", completedSteps: [] });

    try {
      // Start the API call
      const fetchPromise = fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightNumber: input.flightNumber,
          airport: input.airport,
          date: input.date.toISOString(),
          origin: input.origin,
          hasPrecheck: input.hasPrecheck,
          hasClear: input.hasClear,
          hasGlobalEntry: input.hasGlobalEntry,
          checkingBag: input.checkingBag,
          airlineStatus: input.airlineStatus,
        }),
      });

      // Animate through steps while waiting
      await delay(600);
      setState(s => s.status === "loading" ? { ...s, currentStep: "traffic", completedSteps: ["flight"] } : s);

      await delay(600);
      setState(s => s.status === "loading" ? { ...s, currentStep: "security", completedSteps: ["flight", "traffic"] } : s);

      await delay(600);
      setState(s => s.status === "loading" ? { ...s, currentStep: "weather", completedSteps: ["flight", "traffic", "security"] } : s);

      await delay(600);
      setState(s => s.status === "loading" ? { ...s, currentStep: "calculating", completedSteps: ["flight", "traffic", "security", "weather"] } : s);

      // Wait for API response
      const response = await fetchPromise;

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get travel data");
      }

      const data: CalculationResult = await response.json();
      setState({ status: "done", result: data });

    } catch (error) {
      console.error("Calculation error:", error);
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Something went wrong",
      });
    }
  }, []);

  const reset = React.useCallback(() => {
    setState({ status: "idle" });
  }, []);

  return { state, calculate, reset };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
