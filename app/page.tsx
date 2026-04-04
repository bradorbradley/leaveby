"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { FlightInput } from "@/components/FlightInput";
import { OptionsForm } from "@/components/OptionsForm";
import { ResultsScreen } from "@/components/ResultsScreen";
import { ThinkingState } from "@/components/ThinkingState";
import { getAirlineProfile } from "@/lib/airports";
import { parseFlightNumber, resolveDateFromPreset } from "@/lib/flight-utils";
import { useCalculation } from "@/hooks/useCalculation";
import type { AirportCode } from "@/types/airport";
import type { CalculationOptions } from "@/types/calculation";
import type { FlightFormValues, OptionsFormValues } from "@/types/forms";
import type { FlightInfo } from "@/types/flight";

type Screen = "flight" | "options" | "thinking" | "results";

const initialFlightForm: FlightFormValues = {
  flightNumber: "",
  datePreset: "today",
  customDate: "",
  origin: "",
  hasPreCheck: false,
  hasClear: false,
  hasGlobalEntry: false,
  airportCode: "JFK",
};

const initialOptions: OptionsFormValues = {
  checkedBag: false,
  airlineStatus: "None",
  hasTouchlessId: false,
  bufferMinutes: 40,
};

export default function HomePage() {
  const { state, calculate, reset } = useCalculation();
  const [screen, setScreen] = useState<Screen>("flight");
  const [flightForm, setFlightForm] = useState<FlightFormValues>(initialFlightForm);
  const [optionsForm, setOptionsForm] = useState<OptionsFormValues>(initialOptions);
  const [previewFlight, setPreviewFlight] = useState<FlightInfo | null>(null);

  const parsedFlight = useMemo(() => parseFlightNumber(flightForm.flightNumber), [flightForm.flightNumber]);

  useEffect(() => {
    if (state.status === "done") {
      setScreen("results");
    }
  }, [state.status]);

  const continueToOptions = () => {
    if (!parsedFlight) return;
    const airline = getAirlineProfile(parsedFlight.airlineCode);
    const terminal = airline?.airportAssignments[flightForm.airportCode as AirportCode] ?? null;
    const date = resolveDateFromPreset(flightForm.datePreset, flightForm.customDate);

    setPreviewFlight({
      flightNumber: parsedFlight.normalized,
      airlineCode: parsedFlight.airlineCode,
      airlineName: parsedFlight.airlineName,
      departureAirport: flightForm.airportCode as AirportCode,
      destinationAirportCode: undefined,
      destinationCity: undefined,
      departureTime: `${date}T09:00:00.000Z`,
      terminal,
      gate: null,
      status: "unknown",
      delayMinutes: 0,
      region: "domestic",
      source: "Preview",
      notes: [],
    });
    setOptionsForm((current) => ({
      ...current,
      airlineStatus: airline?.statusTiers[0] ?? "None",
      hasTouchlessId: parsedFlight.airlineCode === "DL" ? current.hasTouchlessId : false,
    }));
    setScreen("options");
  };

  const submitCalculation = async () => {
    const date = resolveDateFromPreset(flightForm.datePreset, flightForm.customDate);
    const payloadOptions: CalculationOptions = {
      origin: flightForm.origin,
      hasPreCheck: flightForm.hasPreCheck,
      hasClear: flightForm.hasClear,
      hasGlobalEntry: flightForm.hasGlobalEntry,
      hasTouchlessId: optionsForm.hasTouchlessId,
      checkedBag: optionsForm.checkedBag,
      airlineStatus: optionsForm.airlineStatus,
      mobileBoardingPass: true,
      bufferMinutes: optionsForm.bufferMinutes,
    };

    setScreen("thinking");
    await calculate({
      flightNumber: flightForm.flightNumber,
      date,
      airportCode: flightForm.airportCode as AirportCode,
      origin: flightForm.origin,
      options: payloadOptions,
    });
  };

  const resetAll = () => {
    reset();
    setScreen("flight");
    setFlightForm(initialFlightForm);
    setOptionsForm(initialOptions);
    setPreviewFlight(null);
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
          {screen === "flight" ? (
            <FlightInput
              values={flightForm}
              onChange={(patch) => setFlightForm((current) => ({ ...current, ...patch }))}
              onContinue={continueToOptions}
            />
          ) : null}

          {screen === "options" ? (
            <OptionsForm
              flight={previewFlight}
              values={optionsForm}
              onChange={(patch) => setOptionsForm((current) => ({ ...current, ...patch }))}
              onBack={() => setScreen("flight")}
              onCalculate={submitCalculation}
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
                className="mt-6 rounded-2xl bg-accent px-5 py-3 text-sm font-medium text-accent-foreground"
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
