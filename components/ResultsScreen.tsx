"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { subMinutes } from "date-fns";
import { TimeReveal } from "./TimeReveal";
import { BufferSlider } from "./BufferSlider";
import { Breakdown } from "./Breakdown";
import { ProTip } from "./ProTip";
import { PeakDayBadge } from "./PeakDayBadge";
import { ShareButton } from "./ShareButton";
import { Button } from "@/components/ui/button";
import type { CalculationResult } from "@/types/jfk";

interface ResultsScreenProps {
  result: CalculationResult;
  onStartOver: () => void;
}

export function ResultsScreen({ result, onStartOver }: ResultsScreenProps) {
  const [bufferMinutes, setBufferMinutes] = React.useState(result.bufferMinutes);
  const [isInitialReveal, setIsInitialReveal] = React.useState(true);

  // Recalculate leave time when buffer changes
  const leaveByTime = React.useMemo(() => {
    const bufferDiff = bufferMinutes - result.bufferMinutes;
    return subMinutes(result.leaveByTime, bufferDiff);
  }, [bufferMinutes, result.leaveByTime, result.bufferMinutes]);

  // After initial animation, subsequent changes are not "reveals"
  React.useEffect(() => {
    const timer = setTimeout(() => setIsInitialReveal(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Calculate total time including buffer adjustment
  const totalMinutes = result.totalMinutes + (bufferMinutes - result.bufferMinutes);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto space-y-8"
    >
      {/* Peak Day Badge */}
      {result.isPeakDay && result.peakDayType && (
        <div className="flex justify-center">
          <PeakDayBadge type={result.peakDayType} />
        </div>
      )}

      {/* The Big Time Reveal */}
      <TimeReveal time={leaveByTime} isInitialReveal={isInitialReveal} />

      {/* Buffer Slider */}
      <BufferSlider
        value={bufferMinutes}
        onValueChange={setBufferMinutes}
      />

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.3 }}
          className="space-y-2"
        >
          {result.warnings.map((warning, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-sm text-accent bg-accent/10 rounded-xl p-3"
            >
              <span className="text-accent">!</span>
              <span>{warning}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Breakdown */}
      <Breakdown
        steps={result.breakdown}
        totalMinutes={totalMinutes}
        bufferMinutes={bufferMinutes}
      />

      {/* Pro Tips */}
      {result.proTips.length > 0 && (
        <div className="space-y-3">
          {result.proTips.slice(0, 2).map((tip, i) => (
            <ProTip key={i} tip={tip} delay={1.2 + i * 0.1} />
          ))}
        </div>
      )}

      {/* Share Button */}
      <ShareButton
        leaveTime={leaveByTime}
        flightNumber={result.flightInfo.flightNumber}
        destination={result.flightInfo.destination}
        bufferMinutes={bufferMinutes}
      />

      {/* Start Over */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.3 }}
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
