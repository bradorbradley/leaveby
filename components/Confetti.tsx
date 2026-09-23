"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

import { STAR } from "@/components/Mark";

const COLORS = ["var(--coral)", "var(--mustard)", "var(--ink)", "var(--coral-soft)", "var(--sage)"];

/** A small burst of the app's shapes from the centre of whatever it's placed in. Mount it with a fresh `burst` id to fire. */
export function Confetti({ burst }: { burst: number }) {
  const reduce = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2 + (burst % 7) * 0.3;
        const dist = 46 + ((i * 37 + burst * 11) % 30);
        return { id: `${burst}-${i}`, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 12, rot: ((i * 53) % 180) - 90, color: COLORS[i % COLORS.length], star: i % 3 === 0 };
      }),
    [burst],
  );
  if (reduce || burst === 0) return null;
  return (
    <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-20">
      <AnimatePresence>
        {pieces.map((p) => (
          <motion.svg
            key={p.id}
            width="10"
            height="10"
            viewBox="0 0 100 100"
            className="absolute -left-[5px] -top-[5px]"
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 1, rotate: 0 }}
            animate={{ x: p.x, y: p.y, scale: [0.4, 1.1, 0.9], opacity: [1, 1, 0], rotate: p.rot }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {p.star ? <path d={STAR} fill={p.color} /> : <circle cx="50" cy="50" r="42" fill={p.color} />}
          </motion.svg>
        ))}
      </AnimatePresence>
    </span>
  );
}
