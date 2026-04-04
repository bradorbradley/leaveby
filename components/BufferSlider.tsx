"use client";

import { motion } from "framer-motion";

import { Slider } from "@/components/ui/slider";

export function BufferSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Less</span>
        <Slider value={[value]} min={15} max={60} step={5} onValueChange={([next]) => onChange(next)} />
        <span className="text-sm text-muted-foreground">More</span>
      </div>

      <motion.p
        key={value}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        className="text-center text-sm text-muted-foreground"
      >
        This gives you <span className="font-semibold text-primary">{value} min</span> after security, before boarding
      </motion.p>
    </div>
  );
}
