"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FlightInput, type FlightInputData } from "@/components/FlightInput";
import { OptionsForm, type OptionsData } from "@/components/OptionsForm";
import { ThinkingState } from "@/components/ThinkingState";
import { ResultsScreen } from "@/components/ResultsScreen";
import { useCalculation } from "@/hooks/useCalculation";
import type { CalculationInput } from "@/types/jfk";

type Screen = "input" | "options" | "loading" | "results";

export default function Home() {
  const [screen, setScreen] = React.useState<Screen>("input");
  const [flightData, setFlightData] = React.useState<FlightInputData | null>(null);
  const { state, calculate, reset } = useCalculation();

  // Handle flight input submission
  const handleFlightSubmit = (data: FlightInputData) => {
    setFlightData(data);
    setScreen("options");
  };

  // Handle options submission
  const handleOptionsSubmit = async (options: OptionsData) => {
    if (!flightData) return;

    setScreen("loading");

    const input: CalculationInput = {
      flightNumber: flightData.flightNumber,
      date: flightData.date,
      origin: flightData.origin,
      hasPrecheck: flightData.hasPrecheck,
      hasClear: flightData.hasClear,
      hasGlobalEntry: flightData.hasGlobalEntry,
      hasTouchlessId: options.hasTouchlessId,
      checkingBag: options.checkingBag,
      airlineStatus: options.airlineStatus,
      bufferPreference: 40, // Default 40 min buffer
    };

    await calculate(input);
  };

  // Watch for calculation completion
  React.useEffect(() => {
    if (state.status === "done") {
      setScreen("results");
    }
  }, [state.status]);

  // Handle start over
  const handleStartOver = () => {
    reset();
    setFlightData(null);
    setScreen("input");
  };

  // Handle back from options
  const handleBack = () => {
    setScreen("input");
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:py-12">
      <div className="max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {screen === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FlightInput onSubmit={handleFlightSubmit} />
            </motion.div>
          )}

          {screen === "options" && flightData && (
            <motion.div
              key="options"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <OptionsForm
                flightData={flightData}
                onBack={handleBack}
                onSubmit={handleOptionsSubmit}
              />
            </motion.div>
          )}

          {screen === "loading" && state.status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center min-h-[60vh]"
            >
              <ThinkingState
                currentStep={state.currentStep}
                completedSteps={state.completedSteps}
              />
            </motion.div>
          )}

          {screen === "results" && state.status === "done" && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ResultsScreen
                result={state.result}
                onStartOver={handleStartOver}
              />
            </motion.div>
          )}

          {state.status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-destructive mb-4">{state.message}</p>
              <button
                onClick={handleStartOver}
                className="text-accent underline"
              >
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
