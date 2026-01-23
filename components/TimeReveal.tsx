"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTimeShort } from "@/lib/utils";

interface TimeRevealProps {
  time: Date;
  isInitialReveal?: boolean;
}

export function TimeReveal({ time, isInitialReveal = false }: TimeRevealProps) {
  const { time: timeStr, period } = formatTimeShort(time);
  const digits = timeStr.split("");

  return (
    <div className="relative text-center">
      {/* Glow effect behind time */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-64 h-64 rounded-full bg-accent/10 blur-3xl"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      </div>

      {/* "Leave by" label */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isInitialReveal ? 0.4 : 0, duration: 0.3 }}
        className="text-lg text-text-secondary mb-2"
      >
        Leave by
      </motion.p>

      {/* The time display */}
      <div className="relative z-10 flex items-baseline justify-center">
        <AnimatePresence mode="popLayout">
          {digits.map((digit, i) => (
            <motion.span
              key={`${i}-${digit}`}
              initial={
                isInitialReveal
                  ? { y: 40, opacity: 0, rotateX: -90 }
                  : { scale: 0.95, opacity: 0.5 }
              }
              animate={{ y: 0, opacity: 1, rotateX: 0, scale: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={
                isInitialReveal
                  ? {
                      delay: i * 0.08,
                      duration: 0.5,
                      ease: [0.16, 1, 0.3, 1],
                    }
                  : {
                      duration: 0.15,
                    }
              }
              className="font-display text-7xl md:text-8xl lg:text-9xl font-bold text-primary inline-block"
              style={{ transformOrigin: "center bottom" }}
            >
              {digit}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* AM/PM */}
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: isInitialReveal ? 0.6 : 0.1, duration: 0.3 }}
          className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary ml-2"
        >
          {period}
        </motion.span>
      </div>

      {/* Subtle celebration particles (optional) */}
      {isInitialReveal && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-accent/40"
              initial={{
                x: "50%",
                y: "50%",
                scale: 0,
              }}
              animate={{
                x: `${30 + Math.random() * 40}%`,
                y: `${20 + Math.random() * 30}%`,
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                delay: 0.5 + i * 0.1,
                duration: 1.5,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
