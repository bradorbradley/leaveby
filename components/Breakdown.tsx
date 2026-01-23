"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Car, Briefcase, User, Shield, Footprints, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BreakdownStep } from "@/types/jfk";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  travel: Car,
  checkin: Briefcase,
  bagdrop: Briefcase,
  walk_to_security: User,
  security: Shield,
  walk_to_gate: Footprints,
  buffer: Clock,
};

interface BreakdownRowProps {
  step: BreakdownStep;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function BreakdownRow({ step, index, isExpanded, onToggle }: BreakdownRowProps) {
  const Icon = iconMap[step.id] || Clock;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="border-b border-border last:border-b-0"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 py-4 text-left hover:bg-muted/50 transition-colors rounded-lg px-2 -mx-2"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
          <Icon className="w-4 h-4 text-text-secondary" />
        </div>
        <span className="flex-1 text-foreground">{step.label}</span>
        <span className="font-mono text-sm text-text-secondary">
          {step.minutes} min
        </span>
        {step.details && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-text-muted" />
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && step.details && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pl-11 pr-4 pb-4 text-sm text-text-secondary">
              {step.details}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface BreakdownProps {
  steps: BreakdownStep[];
  totalMinutes: number;
  bufferMinutes: number;
  delayReveal?: boolean;
}

export function Breakdown({
  steps,
  totalMinutes,
  bufferMinutes,
  delayReveal = true,
}: BreakdownProps) {
  const [expandedStep, setExpandedStep] = React.useState<string | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  return (
    <motion.div
      initial={delayReveal ? { opacity: 0, y: 30 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delayReveal ? 0.8 : 0, duration: 0.5 }}
      className="w-full"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="font-medium text-foreground">
          How we calculated this
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-text-muted" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-xl border border-border p-4 mt-2">
              {steps.map((step, index) => (
                <BreakdownRow
                  key={step.id}
                  step={step}
                  index={index}
                  isExpanded={expandedStep === step.id}
                  onToggle={() => toggleStep(step.id)}
                />
              ))}

              {/* Total */}
              <div className="pt-4 mt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="font-mono font-medium text-foreground">
                    {totalMinutes} min
                  </span>
                </div>
                <p className="text-sm text-text-muted mt-1">
                  Includes {bufferMinutes} min buffer before boarding
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
