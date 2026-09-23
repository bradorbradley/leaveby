"use client";

import { motion, useReducedMotion, useTransform } from "framer-motion";

import { useTilt } from "@/components/TiltCard";

/**
 * The geometry of the app: four circles cut from a square make a star, two
 * circles overlapped make a lens. Everything decorative is built from these.
 */
export const STAR = "M50 0A50 50 0 0 0 100 50A50 50 0 0 0 50 100A50 50 0 0 0 0 50A50 50 0 0 0 50 0Z";
export const LENS = "M50 0A62 62 0 0 1 50 100A62 62 0 0 1 50 0Z";

/** The mark: an ink star with a coral dot, printed a hair off-register like a record sleeve. */
export function Mark({ size = 24, className = "", spin = false }: { size?: number; className?: string; spin?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`shrink-0 ${className}`}
      style={{ overflow: "visible" }}
      initial={spin && !reduce ? { rotate: -90, scale: 0.6 } : false}
      animate={{ rotate: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
    >
      <path d={STAR} fill="var(--coral-soft)" transform="translate(4 5)" />
      <path d={STAR} fill="var(--ink)" />
      <motion.circle cx="50" cy="50" r="9" fill="var(--coral)" animate={reduce ? undefined : { scale: [1, 1.25, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} style={{ originX: "50px", originY: "50px" }} />
    </motion.svg>
  );
}

/**
 * A quiet composition behind the big time: a lens, a star, a half circle, a
 * dot. Each layer floats on its own slow loop and drifts with the card's tilt
 * at its own depth, so the card reads as a small stage rather than a print.
 */
export function Geometry({ tone = "paper" }: { tone?: "paper" | "coral" | "mustard" }) {
  const reduce = useReducedMotion();
  const tilt = useTilt();
  const zero = useTransform(() => 0);
  const tx = tilt ? tilt.x : zero;
  const ty = tilt ? tilt.y : zero;
  const far = { x: useTransform(tx, (v) => v * -10), y: useTransform(ty, (v) => v * -10) };
  const mid = { x: useTransform(tx, (v) => v * -18), y: useTransform(ty, (v) => v * -18) };
  const near = { x: useTransform(tx, (v) => v * 26), y: useTransform(ty, (v) => v * 26) };

  const lens = tone === "paper" ? "var(--coral-pale)" : "rgba(252,250,246,0.55)";
  const star = tone === "mustard" ? "var(--coral-soft)" : "var(--mustard-soft)";
  const half = tone === "coral" ? "var(--coral-soft)" : "var(--coral-pale)";
  const floatY = (amp: number, dur: number) => (reduce ? undefined : { y: [0, -amp, 0] });
  const floatT = (dur: number, delay = 0) => ({ duration: dur, repeat: Infinity, ease: "easeInOut" as const, delay });

  return (
    <svg aria-hidden="true" viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full" style={{ overflow: "hidden" }}>
      <motion.g style={far}>
        <motion.path d={LENS} transform="translate(95 -10) scale(2.0 3.2)" fill={lens} animate={floatY(6, 9)} transition={floatT(9)} />
      </motion.g>
      <motion.g style={mid}>
        <motion.path d="M0 300A120 120 0 0 1 120 180V300Z" fill={half} animate={reduce ? undefined : { x: [0, 6, 0] }} transition={floatT(11, 1)} />
      </motion.g>
      <motion.g style={near}>
        <motion.g animate={reduce ? undefined : { y: [0, -7, 0], rotate: [0, 8, 0] }} transition={floatT(7)} style={{ originX: "57px", originY: "49px" }}>
          <path d={STAR} transform="translate(30 22) scale(0.62)" fill="var(--coral-pale)" />
          <path d={STAR} transform="translate(26 18) scale(0.62)" fill={star} />
          <circle cx="57" cy="49" r="3.5" fill="var(--paper)" />
        </motion.g>
        <motion.g animate={reduce ? undefined : { y: [0, 5, 0], rotate: [0, -10, 0] }} transition={floatT(8, 2)} style={{ originX: "335px", originY: "233px" }}>
          <path d={STAR} transform="translate(318 216) scale(0.34)" fill="var(--ink)" />
          <circle cx="335" cy="233" r="3.2" fill="var(--paper)" />
        </motion.g>
      </motion.g>
    </svg>
  );
}
