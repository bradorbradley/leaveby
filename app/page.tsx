"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FlightInput, type FlightInputData } from "@/components/FlightInput";
import { ThinkingState } from "@/components/ThinkingState";
import { ResultsScreen } from "@/components/ResultsScreen";
import { useCalculation, type CalculationInput } from "@/hooks/useCalculation";

type Screen = "input" | "loading" | "results";

export default function Home() {
  const [screen, setScreen] = React.useState<Screen>("input");
  const { state, calculate, reset } = useCalculation();

  // Handle flight input submission - go straight to calculation
  const handleSubmit = async (data: FlightInputData) => {
    setScreen("loading");

    const input: CalculationInput = {
      flightNumber: data.flightNumber,
      airport: data.airport,
      date: data.date,
      origin: data.origin,
      hasPrecheck: data.hasPrecheck,
      hasClear: data.hasClear,
      hasGlobalEntry: data.hasGlobalEntry,
      checkingBag: false, // Default to no checked bag for simplicity
      airlineStatus: "none",
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
    setScreen("input");
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:py-12">
      <div className="max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {screen === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FlightInput onSubmit={handleSubmit} />
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
