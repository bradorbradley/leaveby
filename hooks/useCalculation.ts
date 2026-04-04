"use client";

import { useState } from "react";

import { safeJsonParse } from "@/lib/utils";
import type { AirportCode } from "@/types/airport";
import type { CalculationOptions, CalculationResult } from "@/types/calculation";

type CalculationStep = "flight" | "traffic" | "security" | "weather" | "calculating";

type CalcState =
  | { status: "idle" }
  | {
      status: "loading";
      step: CalculationStep;
      completedSteps: CalculationStep[];
      partial: Partial<Record<CalculationStep, unknown>>;
    }
  | { status: "done"; result: CalculationResult }
  | { status: "error"; message: string };

export function useCalculation() {
  const [state, setState] = useState<CalcState>({ status: "idle" });

  const calculate = async (payload: {
    flightNumber: string;
    date: string;
    airportCode: AirportCode;
    origin: string;
    options: CalculationOptions;
  }) => {
    try {
      setState({
        status: "loading",
        step: "flight",
        completedSteps: [],
        partial: {},
      });

      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        setState({ status: "error", message: "The calculation request failed." });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const update = safeJsonParse<Record<string, unknown>>(line);
          if (!update) continue;

          if (update.step === "done" && update.result) {
            setState({ status: "done", result: update.result as CalculationResult });
            continue;
          }

          if (update.step === "error") {
            setState({ status: "error", message: String(update.message ?? "Calculation failed.") });
            continue;
          }

          if (update.status === "loading") {
            setState((current) =>
              current.status === "loading"
                ? { ...current, step: update.step as CalculationStep }
                : current,
            );
            continue;
          }

          if (update.status === "done") {
            setState((current) => {
              if (current.status !== "loading") return current;
              const step = update.step as CalculationStep;
              return {
                ...current,
                completedSteps: current.completedSteps.includes(step)
                  ? current.completedSteps
                  : [...current.completedSteps, step],
                partial: {
                  ...current.partial,
                  [step]: update.data,
                },
              };
            });
          }
        }
      }
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Calculation failed.",
      });
    }
  };

  return { state, calculate, reset: () => setState({ status: "idle" }) };
}
