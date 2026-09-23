"use client";

import { motion, useReducedMotion } from "framer-motion";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Digits that roll into place like a departures board. Each digit is a column
 * of 0–9 that springs to its value; on first mount it rolls up from zero, and
 * when the value changes (the slider) only the digits that changed move.
 */
export function RollingNumber({ value, className = "" }: { value: string; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span className={`inline-flex items-baseline ${className}`} aria-label={value} role="text">
      {value.split("").map((ch, i) => {
        const d = DIGITS.indexOf(ch);
        if (d < 0) {
          return (
            <span key={`s${i}`} aria-hidden="true">
              {ch}
            </span>
          );
        }
        return (
          <span key={`d${i}`} aria-hidden="true" className="inline-block overflow-hidden" style={{ height: "1em", lineHeight: 1 }}>
            <motion.span
              className="flex flex-col"
              initial={reduce ? { y: `-${d}em` } : { y: "0em" }}
              animate={{ y: `-${d}em` }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 18, mass: 1, delay: i * 0.06 }}
            >
              {DIGITS.map((n) => (
                <span key={n} className="block" style={{ height: "1em", lineHeight: 1 }}>
                  {n}
                </span>
              ))}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
