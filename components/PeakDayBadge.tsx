"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Flame, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PeakDayBadgeProps {
  type: "extreme" | "high" | "moderate";
  description?: string;
}

export function PeakDayBadge({ type, description }: PeakDayBadgeProps) {
  const config = {
    extreme: {
      icon: Flame,
      label: "Busiest travel day",
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    high: {
      icon: AlertTriangle,
      label: "Very busy day",
      color: "text-accent",
      bg: "bg-accent/10",
    },
    moderate: {
      icon: TrendingUp,
      label: "Busier than usual",
      color: "text-primary",
      bg: "bg-primary/10",
    },
  };

  const { icon: Icon, label, color, bg } = config[type];

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.5 }}
      className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full", bg)}
    >
      <Icon className={cn("w-4 h-4", color)} />
      <span className={cn("text-sm font-medium", color)}>{label}</span>
      {description && (
        <span className="text-sm text-text-muted">- {description}</span>
      )}
    </motion.div>
  );
}
