"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ToggleGroupOption {
  value: string;
  label: string;
}

export interface ToggleGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ToggleGroupOption[];
  label?: string;
  className?: string;
  disabled?: boolean;
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ value, onValueChange, options, label, className, disabled }, ref) => {
    return (
      <div ref={ref} className={cn("w-full", className)}>
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => !disabled && onValueChange(option.value)}
              disabled={disabled}
              className={cn(
                "relative flex-1 px-4 py-3 text-base font-medium rounded-lg transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {value === option.value && (
                <motion.div
                  layoutId="toggle-active"
                  className="absolute inset-0 bg-card rounded-lg shadow-sm"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className={cn(
                  "relative z-10",
                  value === option.value ? "text-foreground" : "text-text-muted"
                )}
              >
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }
);
ToggleGroup.displayName = "ToggleGroup";

export { ToggleGroup };
