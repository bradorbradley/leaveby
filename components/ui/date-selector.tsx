"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { format, addDays, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";

export interface DateSelectorProps {
  value: Date;
  onValueChange: (date: Date) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

const DateSelector = React.forwardRef<HTMLDivElement, DateSelectorProps>(
  ({ value, onValueChange, label, className, disabled }, ref) => {
    const [showCalendar, setShowCalendar] = React.useState(false);
    const today = new Date();
    const tomorrow = addDays(today, 1);

    const getSelectedType = () => {
      if (isToday(value)) return "today";
      if (isTomorrow(value)) return "tomorrow";
      return "custom";
    };

    const selectedType = getSelectedType();

    return (
      <div ref={ref} className={cn("w-full", className)}>
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              onValueChange(today);
              setShowCalendar(false);
            }}
            disabled={disabled}
            className={cn(
              "relative flex-1 px-4 py-3 text-base font-medium rounded-xl border-2 transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              selectedType === "today"
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border bg-card text-text-muted hover:border-accent/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {selectedType === "today" && (
              <motion.div
                layoutId="date-active"
                className="absolute inset-0 rounded-xl border-2 border-accent"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">Today</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onValueChange(tomorrow);
              setShowCalendar(false);
            }}
            disabled={disabled}
            className={cn(
              "relative flex-1 px-4 py-3 text-base font-medium rounded-xl border-2 transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              selectedType === "tomorrow"
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border bg-card text-text-muted hover:border-accent/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {selectedType === "tomorrow" && (
              <motion.div
                layoutId="date-active"
                className="absolute inset-0 rounded-xl border-2 border-accent"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">Tomorrow</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
            disabled={disabled}
            className={cn(
              "relative px-4 py-3 rounded-xl border-2 transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              selectedType === "custom"
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border bg-card text-text-muted hover:border-accent/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {selectedType === "custom" && (
              <motion.div
                layoutId="date-active"
                className="absolute inset-0 rounded-xl border-2 border-accent"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Calendar className="h-5 w-5 relative z-10" />
          </button>
        </div>

        {showCalendar && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-4 bg-card border border-border rounded-xl shadow-lg"
          >
            <input
              type="date"
              value={format(value, "yyyy-MM-dd")}
              min={format(today, "yyyy-MM-dd")}
              onChange={(e) => {
                const date = new Date(e.target.value + "T12:00:00");
                onValueChange(date);
                setShowCalendar(false);
              }}
              className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background focus:outline-none focus:border-accent"
            />
          </motion.div>
        )}

        {selectedType === "custom" && !showCalendar && (
          <p className="mt-2 text-sm text-text-secondary">
            {format(value, "EEEE, MMMM d, yyyy")}
          </p>
        )}
      </div>
    );
  }
);
DateSelector.displayName = "DateSelector";

export { DateSelector };
