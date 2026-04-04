"use client";

import { motion } from "framer-motion";

export function PeakDayBadge({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 360, damping: 24 }}
      className="inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-sm text-accent"
    >
      Peak travel day: {label}
    </motion.div>
  );
}
