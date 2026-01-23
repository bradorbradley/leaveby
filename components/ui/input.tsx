"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, hint, error, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        <motion.div
          animate={{
            boxShadow: isFocused
              ? "0 0 0 3px rgba(224, 123, 84, 0.2)"
              : "0 0 0 0px rgba(224, 123, 84, 0)",
          }}
          transition={{ duration: 0.2 }}
          className="rounded-xl"
        >
          <input
            type={type}
            className={cn(
              "flex h-12 w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
              error && "border-destructive",
              className
            )}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
        </motion.div>
        {hint && !error && (
          <p className="mt-1.5 text-sm text-text-muted">{hint}</p>
        )}
        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
