"use client";

import { format } from "date-fns";
import { motion } from "framer-motion";

export function TimeReveal({ isoTime, isLate = false }: { isoTime: string; isLate?: boolean }) {
  const date = new Date(isoTime);
  const timeString = format(date, "h:mma").toLowerCase();
  const [main, suffix] = [timeString.slice(0, -2), timeString.slice(-2)];

  return (
    <div className="relative text-center">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-3 text-base text-muted-foreground sm:text-lg"
      >
        Leave by
      </motion.p>
      <div className="relative inline-flex items-end justify-center">
        <div className="absolute inset-0 rounded-full bg-accent/15 blur-3xl" />
        <motion.h1
          key={isoTime}
          initial={{ scale: 0.96, opacity: 0.35 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className={`relative z-10 font-display text-[4.5rem] font-semibold tracking-tight sm:text-[6rem] ${
            isLate ? "text-accent" : "text-primary"
          }`}
        >
          {main.split("").map((digit, index) => (
            <motion.span
              key={`${digit}-${index}`}
              initial={{ y: 40, opacity: 0, rotateX: -90 }}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block"
            >
              {digit}
            </motion.span>
          ))}
          <span className="ml-2 text-[2rem] lowercase sm:text-[3rem]">{suffix}</span>
        </motion.h1>
      </div>
    </div>
  );
}
