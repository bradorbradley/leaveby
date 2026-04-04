"use client";

import { motion } from "framer-motion";
import { Calculator, Car, Check, Cloud, Plane, Shield, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const thinkingSteps = [
  { id: "flight", label: "Finding your flight...", icon: Plane },
  { id: "traffic", label: "Checking current traffic...", icon: Car },
  { id: "security", label: "Scanning terminal security lines...", icon: Shield },
  { id: "weather", label: "Checking conditions...", icon: Cloud },
  { id: "calculating", label: "Crunching the numbers...", icon: Calculator },
] as const;

export function ThinkingState({
  currentStep,
  completedSteps,
}: {
  currentStep: string;
  completedSteps: string[];
}) {
  const progress = ((completedSteps.length + 0.5) / thinkingSteps.length) * 100;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center justify-center">
      <Card className="relative w-full overflow-hidden border-primary/10 bg-white/90">
        <div className="absolute inset-y-0 left-0 w-24 bg-shimmer opacity-60 animate-shimmer" />
        <CardHeader className="relative">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Sparkles className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">Checking everything that matters</CardTitle>
        </CardHeader>
        <CardContent className="relative space-y-4">
          {thinkingSteps.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isComplete = completedSteps.includes(step.id);

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${
                  isActive ? "bg-secondary" : ""
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    isComplete ? "bg-success/20 text-success" : isActive ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <motion.div
                      animate={isActive ? { rotate: 360 } : undefined}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                    >
                      <Icon className="h-4 w-4" />
                    </motion.div>
                  )}
                </div>
                <div>
                  <p className={`text-sm ${isActive ? "text-primary" : "text-muted-foreground"}`}>{step.label}</p>
                </div>
              </motion.div>
            );
          })}

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full bg-accent"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
