"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface ProTipProps {
  tip: string;
  delay?: number;
}

export function ProTip({ tip, delay = 1.2 }: ProTipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-start gap-3 bg-success/10 border border-success/20 rounded-xl p-4"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-success/20 shrink-0">
        <Lightbulb className="w-4 h-4 text-success" />
      </div>
      <div>
        <span className="text-sm font-medium text-success">Pro tip</span>
        <p className="text-sm text-text-secondary mt-0.5">{tip}</p>
      </div>
    </motion.div>
  );
}
