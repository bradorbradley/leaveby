"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { createContext, useContext, type PointerEvent, type ReactNode } from "react";

interface Tilt {
  x: MotionValue<number>;
  y: MotionValue<number>;
}

const TiltContext = createContext<Tilt | null>(null);

/** Read the card's tilt from inside so layers can drift at different depths. */
export function useTilt() {
  return useContext(TiltContext);
}

/**
 * A card that leans toward your finger or pointer, with a soft sheen that
 * follows it, and gives its children a shared tilt so background shapes can
 * move at their own depth. Rests flat when nothing touches it.
 */
export function TiltCard({ children, className = "", max = 7 }: { children: ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spring = { stiffness: 140, damping: 18, mass: 0.6 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [max, -max]), spring);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-max, max]), spring);
  const sheenX = useSpring(useTransform(x, [-0.5, 0.5], [15, 85]), spring);
  const sheenY = useSpring(useTransform(y, [-0.5, 0.5], [10, 90]), spring);
  const sheenTarget = useTransform(x, (v: number): number => (Math.abs(v) > 0.02 ? 0.55 : 0));
  const sheenOpacity = useSpring(sheenTarget, { stiffness: 80, damping: 20 });
  const sheen = useTransform([sheenX, sheenY], ([sx, sy]) => `radial-gradient(circle at ${sx}% ${sy}%, rgba(255,255,255,0.65), rgba(255,255,255,0) 55%)`);

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const leave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <TiltContext.Provider value={{ x, y }}>
      <motion.div
        className={className}
        style={reduce ? undefined : { rotateX, rotateY, transformPerspective: 1000, transformStyle: "preserve-3d" }}
        onPointerMove={move}
        onPointerLeave={leave}
        onPointerCancel={leave}
        onPointerUp={leave}
      >
        {children}
        {reduce ? null : <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ backgroundImage: sheen, opacity: sheenOpacity, mixBlendMode: "soft-light" }} />}
      </motion.div>
    </TiltContext.Provider>
  );
}
