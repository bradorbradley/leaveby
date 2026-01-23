"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Car, Shield, Cloud, Calculator, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const thinkingSteps = [
  { id: "flight", label: "Finding your flight...", icon: Plane },
  { id: "traffic", label: "Checking current traffic...", icon: Car },
  { id: "security", label: "Scanning security lines...", icon: Shield },
  { id: "weather", label: "Checking conditions...", icon: Cloud },
  { id: "calculating", label: "Crunching the numbers...", icon: Calculator },
];

interface ThinkingStateProps {
  currentStep: string;
  completedSteps: string[];
}

export function ThinkingState({ currentStep, completedSteps }: ThinkingStateProps) {
  const currentIndex = thinkingSteps.findIndex((s) => s.id === currentStep);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="relative bg-card rounded-2xl border border-border p-8 shadow-lg">
        {/* Gradient shimmer effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="relative space-y-4">
          {thinkingSteps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = step.id === currentStep;
            const isUpcoming = !isCompleted && !isCurrent;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className={cn(
                  "flex items-center gap-4 py-2 transition-opacity",
                  isUpcoming && "opacity-40"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl transition-colors",
                    isCompleted && "bg-success/20",
                    isCurrent && "bg-accent/20",
                    isUpcoming && "bg-muted"
                  )}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <Check className="w-5 h-5 text-success" />
                    </motion.div>
                  ) : isCurrent ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Icon className="w-5 h-5 text-accent" />
                    </motion.div>
                  ) : (
                    <Icon className="w-5 h-5 text-text-muted" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-base transition-colors",
                    isCompleted && "text-success",
                    isCurrent && "text-foreground font-medium",
                    isUpcoming && "text-text-muted"
                  )}
                >
                  {isCompleted
                    ? step.label.replace("...", "")
                    : step.label}
                </span>

                {/* Pulse indicator for current step */}
                {isCurrent && (
                  <motion.div
                    className="ml-auto w-2 h-2 rounded-full bg-accent"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-8">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: "0%" }}
              animate={{
                width: `${((currentIndex + 1) / thinkingSteps.length) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Export step IDs for use in parent components
export const THINKING_STEPS = thinkingSteps.map((s) => s.id);
