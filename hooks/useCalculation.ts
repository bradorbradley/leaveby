"use client";

import * as React from "react";
import { calculateLeaveByTime } from "@/lib/calculator";
import type { CalculationResult, CalculationInput } from "@/types/jfk";
import { THINKING_STEPS } from "@/components/ThinkingState";

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
      // Simulate step-by-step progress with delays
      // In production, these would be actual API calls

      // Step 1: Flight info
      await simulateStep(800);
      setState((s) =>
        s.status === "loading"
          ? {
              ...s,
              currentStep: "traffic",
              completedSteps: [...s.completedSteps, "flight"],
            }
          : s
      );

      // Step 2: Traffic
      await simulateStep(1000);
      setState((s) =>
        s.status === "loading"
          ? {
              ...s,
              currentStep: "security",
              completedSteps: [...s.completedSteps, "traffic"],
            }
          : s
      );

      // Step 3: Security
      await simulateStep(800);
      setState((s) =>
        s.status === "loading"
          ? {
              ...s,
              currentStep: "weather",
              completedSteps: [...s.completedSteps, "security"],
            }
          : s
      );

      // Step 4: Weather
      await simulateStep(600);
      setState((s) =>
        s.status === "loading"
          ? {
              ...s,
              currentStep: "calculating",
              completedSteps: [...s.completedSteps, "weather"],
            }
          : s
      );

      // Step 5: Calculate
      await simulateStep(500);

      // For now, use mock travel time (in production, this would come from scraping)
      const mockTravelTime = getMockTravelTime(input.origin);

      const result = calculateLeaveByTime({
        input,
        travelTimeMinutes: mockTravelTime,
        flightInfo: {
          destination: getMockDestination(input.flightNumber),
          isInternational: isLikelyInternational(input.flightNumber),
        },
      });

      setState({ status: "done", result });
    } catch (error) {
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

// Helper to simulate API delays
function simulateStep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Mock travel time based on origin (in production, would come from Google Maps)
function getMockTravelTime(origin: string): number {
  const lowerOrigin = origin.toLowerCase();

  // Manhattan neighborhoods
  if (
    lowerOrigin.includes("manhattan") ||
    lowerOrigin.includes("midtown") ||
    lowerOrigin.includes("upper east") ||
    lowerOrigin.includes("upper west") ||
    lowerOrigin.includes("chelsea") ||
    lowerOrigin.includes("soho") ||
    lowerOrigin.includes("tribeca") ||
    lowerOrigin.includes("10001") ||
    lowerOrigin.includes("10019") ||
    lowerOrigin.includes("10022")
  ) {
    return 45 + Math.floor(Math.random() * 15); // 45-60 min
  }

  // Brooklyn
  if (
    lowerOrigin.includes("brooklyn") ||
    lowerOrigin.includes("williamsburg") ||
    lowerOrigin.includes("park slope") ||
    lowerOrigin.includes("11201") ||
    lowerOrigin.includes("11211")
  ) {
    return 35 + Math.floor(Math.random() * 15); // 35-50 min
  }

  // Queens (closer to JFK)
  if (
    lowerOrigin.includes("queens") ||
    lowerOrigin.includes("astoria") ||
    lowerOrigin.includes("jamaica") ||
    lowerOrigin.includes("11101") ||
    lowerOrigin.includes("11432")
  ) {
    return 20 + Math.floor(Math.random() * 15); // 20-35 min
  }

  // Long Island
  if (
    lowerOrigin.includes("long island") ||
    lowerOrigin.includes("nassau") ||
    lowerOrigin.includes("suffolk")
  ) {
    return 30 + Math.floor(Math.random() * 20); // 30-50 min
  }

  // New Jersey
  if (
    lowerOrigin.includes("jersey") ||
    lowerOrigin.includes("hoboken") ||
    lowerOrigin.includes("newark")
  ) {
    return 50 + Math.floor(Math.random() * 20); // 50-70 min
  }

  // Default
  return 40 + Math.floor(Math.random() * 15); // 40-55 min
}

// Mock destination based on flight number
function getMockDestination(flightNumber: string): string {
  const upper = flightNumber.toUpperCase();

  // Common destinations by airline
  if (upper.startsWith("DL")) {
    const destinations = ["Los Angeles", "San Francisco", "Atlanta", "Seattle", "Miami"];
    return destinations[Math.floor(Math.random() * destinations.length)];
  }
  if (upper.startsWith("AA")) {
    const destinations = ["Dallas", "Chicago", "Los Angeles", "Miami", "Phoenix"];
    return destinations[Math.floor(Math.random() * destinations.length)];
  }
  if (upper.startsWith("B6")) {
    const destinations = ["Boston", "Fort Lauderdale", "San Juan", "Los Angeles", "San Francisco"];
    return destinations[Math.floor(Math.random() * destinations.length)];
  }
  if (upper.startsWith("BA") || upper.startsWith("VS")) {
    return "London";
  }
  if (upper.startsWith("AF")) {
    return "Paris";
  }
  if (upper.startsWith("LH")) {
    return "Frankfurt";
  }
  if (upper.startsWith("EI")) {
    return "Dublin";
  }

  return "Unknown";
}

// Check if flight is likely international based on airline code
function isLikelyInternational(flightNumber: string): boolean {
  const upper = flightNumber.toUpperCase();
  const internationalAirlines = [
    "AF",
    "LH",
    "BA",
    "VS",
    "EI",
    "KL",
    "EK",
    "EY",
    "SQ",
    "QR",
    "TK",
    "FI",
    "NH",
  ];
  return internationalAirlines.some((code) => upper.startsWith(code));
}
