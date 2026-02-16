"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { RotateCcw, Plane, Car, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProTip } from "./ProTip";
import type { CalculationResult } from "@/hooks/useCalculation";

interface ResultsScreenProps {
  result: CalculationResult;
  onStartOver: () => void;
}

export function ResultsScreen({ result, onStartOver }: ResultsScreenProps) {
  const [isInitialReveal, setIsInitialReveal] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsInitialReveal(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Parse the leave by time string to extract parts
  const leaveByTime = result.leaveByTime;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto space-y-8"
    >
      {/* Flight Info Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <p className="text-text-secondary">
          {result.flight.airline} {result.flight.number} to {result.flight.destination}
        </p>
        <p className="text-sm text-text-muted">
          Terminal {result.flight.terminal} • Departs {result.flight.departureTime}
        </p>
      </motion.div>

      {/* The Big Time */}
      <div className="relative text-center py-8">
        {/* Glow effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            className="w-64 h-64 rounded-full bg-accent/10 blur-3xl"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-text-secondary mb-2"
        >
          Leave by
        </motion.p>

        <motion.h1
          initial={isInitialReveal ? { scale: 0.8, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
          className="font-display text-7xl md:text-8xl font-bold text-primary relative z-10"
        >
          {leaveByTime}
        </motion.h1>
      </div>

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-2"
        >
          {result.warnings.map((warning, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-sm text-accent bg-accent/10 rounded-xl p-3"
            >
              <span className="text-accent font-bold">!</span>
              <span>{warning}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-card rounded-2xl border border-border p-5 space-y-4"
      >
        <h3 className="font-medium text-foreground">How we calculated this</h3>

        <div className="space-y-3">
          {/* Travel */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Car className="w-4 h-4 text-text-secondary" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="text-foreground">Travel to airport</span>
                <span className="font-mono text-sm text-text-secondary">
                  {result.breakdown.travelMinutes} min
                </span>
              </div>
              <p className="text-sm text-text-muted">{result.breakdown.travelDescription}</p>
            </div>
          </div>

          {/* Security */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-text-secondary" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="text-foreground">Security</span>
                <span className="font-mono text-sm text-text-secondary">
                  {result.breakdown.securityMinutes} min
                </span>
              </div>
              <p className="text-sm text-text-muted">{result.breakdown.securityDescription}</p>
            </div>
          </div>

          {/* Buffer */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-text-secondary" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="text-foreground">Airport buffer</span>
                <span className="font-mono text-sm text-text-secondary">
                  {result.breakdown.airportBufferMinutes} min
                </span>
              </div>
              <p className="text-sm text-text-muted">{result.breakdown.airportBufferDescription}</p>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="pt-3 border-t border-border flex justify-between">
          <span className="font-medium text-foreground">Total</span>
          <span className="font-mono font-medium text-foreground">
            {result.totalMinutes} min
          </span>
        </div>
      </motion.div>

      {/* Tips */}
      {result.tips && result.tips.length > 0 && (
        <div className="space-y-3">
          {result.tips.slice(0, 2).map((tip, i) => (
            <ProTip key={i} tip={tip} delay={1.0 + i * 0.1} />
          ))}
        </div>
      )}

      {/* Start Over */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="pt-4"
      >
        <Button
          variant="ghost"
          onClick={onStartOver}
          className="w-full gap-2 text-text-muted"
        >
          <RotateCcw className="w-4 h-4" />
          Start over
        </Button>
      </motion.div>
    </motion.div>
  );
}
