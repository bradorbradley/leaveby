"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";

interface BufferSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function BufferSlider({
  value,
  onValueChange,
  min = 15,
  max = 60,
  step = 5,
}: BufferSliderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.3 }}
      className="space-y-4"
    >
      <motion.p
        key={value}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        className="text-center text-text-secondary"
      >
        This gives you{" "}
        <span className="font-semibold text-primary">{value} min</span> after
        security, before boarding
      </motion.p>

      <Slider
        value={value}
        onValueChange={onValueChange}
        min={min}
        max={max}
        step={step}
        minLabel="Less"
        maxLabel="More"
      />
    </motion.div>
  );
}
