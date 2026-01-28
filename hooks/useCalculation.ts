"use client";

import * as React from "react";
import { calculateLeaveByTime } from "@/lib/calculator";
import type { CalculationResult, CalculationInput, TerminalId } from "@/types/jfk";

type CalcState =
  | { status: "idle" }
  | { status: "loading"; currentStep: string; completedSteps: string[] }
  | { status: "done"; result: CalculationResult }
  | { status: "error"; message: string };

interface ClaudeResponse {
  flight: {
    status: "on_time" | "delayed" | "cancelled";
    departureTime: string;
    terminal: string;
    gate: string | null;
    delayMinutes: number | null;
    destination: string;
    isInternational: boolean;
  };
  traffic: {
    durationMinutes: number;
    description: string;
    level: "light" | "moderate" | "heavy" | "severe";
  };
  security: {
    estimatedWaitMinutes: number;
    notes: string;
  };
  weather: {
    conditions: string;
    impactOnTravel: "none" | "minor" | "moderate" | "severe";
  };
  warnings: string[];
  tips: string[];
}

export function useCalculation() {
  const [state, setState] = React.useState<CalcState>({ status: "idle" });

  const calculate = React.useCallback(async (input: CalculationInput) => {
    setState({ status: "loading", currentStep: "flight", completedSteps: [] });

    try {
      // Call Claude API to get real-time data
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightNumber: input.flightNumber,
          date: input.date.toISOString(),
          origin: input.origin,
          hasPrecheck: input.hasPrecheck,
          hasClear: input.hasClear,
          checkingBag: input.checkingBag,
        }),
      });

      // Update progress as we "process" the response
      setState((s) =>
        s.status === "loading"
          ? { ...s, currentStep: "traffic", completedSteps: ["flight"] }
          : s
      );
      await delay(400);

      setState((s) =>
        s.status === "loading"
          ? { ...s, currentStep: "security", completedSteps: ["flight", "traffic"] }
          : s
      );
      await delay(400);

      setState((s) =>
        s.status === "loading"
          ? { ...s, currentStep: "weather", completedSteps: ["flight", "traffic", "security"] }
          : s
      );
      await delay(400);

      setState((s) =>
        s.status === "loading"
          ? { ...s, currentStep: "calculating", completedSteps: ["flight", "traffic", "security", "weather"] }
          : s
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get travel data");
      }

      const data: ClaudeResponse = await response.json();

      // Use Claude's real-time data in the calculation
      const result = calculateLeaveByTime({
        input,
        travelTimeMinutes: data.traffic.durationMinutes,
        securityWaitMinutes: data.security.estimatedWaitMinutes,
        flightInfo: {
          destination: data.flight.destination,
          isInternational: data.flight.isInternational,
          terminal: data.flight.terminal as TerminalId,
          gate: data.flight.gate || undefined,
          status: data.flight.status === "on_time" ? "on_time" :
                  data.flight.status === "delayed" ? "delayed" :
                  data.flight.status === "cancelled" ? "cancelled" : "unknown",
          delayMinutes: data.flight.delayMinutes || undefined,
        },
      });

      // Add Claude's warnings and tips to the result
      if (data.warnings?.length) {
        result.warnings = [...result.warnings, ...data.warnings];
      }
      if (data.tips?.length) {
        result.proTips = [...data.tips, ...result.proTips];
      }

      // Add traffic and weather info to breakdown details
      const trafficStep = result.breakdown.find(s => s.id === "travel");
      if (trafficStep) {
        trafficStep.details = `${data.traffic.description}. Traffic: ${data.traffic.level}.`;
      }

      // Add weather warning if significant
      if (data.weather.impactOnTravel !== "none") {
        result.warnings.push(`Weather: ${data.weather.conditions}`);
      }

      setState({ status: "done", result });

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
  return new Promise((resolve) => setTimeout(resolve, ms));
}
