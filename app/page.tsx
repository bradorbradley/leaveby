"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { FlightInput } from "@/components/FlightInput";
import { ResultsScreen } from "@/components/ResultsScreen";
import { ThinkingState } from "@/components/ThinkingState";
import { inferAirportFromFlightContext, resolveDateFromPreset } from "@/lib/flight-utils";
import { useCalculation } from "@/hooks/useCalculation";
import type { CalculationOptions } from "@/types/calculation";
import type { LeaveByFormValues } from "@/types/forms";

type Screen = "input" | "thinking" | "results";

const initialForm: LeaveByFormValues = {
  flightNumber: "",
  datePreset: "today",
  customDate: "",
  origin: "",
  checkedBag: false,
  hasPreCheck: false,
  hasClear: false,
  hasGlobalEntry: false,
  bufferMinutes: 40,
};

export default function HomePage() {
  const { state, calculate, reset } = useCalculation();
  const [screen, setScreen] = useState<Screen>("input");
  const [form, setForm] = useState<LeaveByFormValues>(initialForm);

  useEffect(() => {
    if (state.status === "done") {
      setScreen("results");
    }
  }, [state.status]);

  const submitCalculation = async () => {
    const date = resolveDateFromPreset(form.datePreset, form.customDate);
    const payloadOptions: CalculationOptions = {
      origin: form.origin,
      hasPreCheck: form.hasPreCheck,
      hasClear: form.hasClear,
      hasGlobalEntry: form.hasGlobalEntry,
      hasTouchlessId: false,
      checkedBag: form.checkedBag,
      airlineStatus: "None",
      mobileBoardingPass: true,
      bufferMinutes: form.bufferMinutes,
    };

    setScreen("thinking");
    await calculate({
      flightNumber: form.flightNumber,
      date,
      airportCode: inferAirportFromFlightContext(form.flightNumber),
      origin: form.origin,
      options: payloadOptions,
    });
  };

  const resetAll = () => {
    reset();
    setScreen("input");
    setForm(initialForm);
  };

  return (
    <main className="app-shell">
      <div className="mb-8 flex items-center justify-between pt-2">
        <div>
          <p className="section-label">Airport Math, handled</p>
          <p className="mt-1 text-sm text-muted-foreground">Mobile-first departure timing for major U.S. airports.</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.3 }}
        >
          {screen === "input" ? (
            <FlightInput
              values={form}
              onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
              onSubmit={submitCalculation}
            />
          ) : null}

          {screen === "thinking" && state.status === "loading" ? (
            <ThinkingState currentStep={state.step} completedSteps={state.completedSteps} />
          ) : null}

          {screen === "results" && state.status === "done" ? (
            <ResultsScreen result={state.result} onBack={resetAll} />
          ) : null}

          {state.status === "error" ? (
            <div className="glass-card mx-auto max-w-xl p-8 text-center">
              <h2 className="text-3xl">We hit a snag</h2>
              <p className="mt-3 text-sm text-muted-foreground">{state.message}</p>
              <button
                type="button"
                className="mt-6 min-h-12 rounded-2xl bg-accent px-5 py-3 text-sm font-medium text-accent-foreground"
                onClick={resetAll}
              >
                Try again
              </button>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
