"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Small living illustrations in the app's palette. Each is a 24×24 stroke
 * icon with one motion that says what the step is: the car rolls in, the
 * plane takes off, the walker bobs, the scanner sweeps, the coffee steams.
 */

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const loop = (duration: number, delay = 0) => ({ duration, repeat: Infinity, repeatDelay: delay, ease: "easeInOut" as const });

export function PlaneGlyph({ size = 18, takeoff = false, repeat = false, className = "" }: { size?: number; takeoff?: boolean; repeat?: boolean; className?: string }) {
  const reduce = useReducedMotion();
  const fly = takeoff && !reduce;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <motion.g
        style={{ originX: "12px", originY: "12px" }}
        animate={fly ? { x: [0, 3, 16, -14, 0], y: [0, -1, -13, 9, 0], rotate: [0, -6, -30, -10, 0], opacity: [1, 1, 0, 0, 1] } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
        transition={fly ? { duration: 1.5, times: [0, 0.3, 0.55, 0.6, 1], ease: [0.3, 0, 0.2, 1], repeat: repeat ? Infinity : 0, repeatDelay: 4 } : { duration: 0.3 }}
      >
        <path fill="currentColor" d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </motion.g>
    </svg>
  );
}

export function CarGlyph({ size = 18, drive = true, className = "" }: { size?: number; drive?: boolean; className?: string }) {
  const reduce = useReducedMotion();
  const roll = drive && !reduce;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <motion.g initial={roll ? { x: -16, opacity: 0 } : false} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 16 }}>
        <path {...stroke} d="M4 16h16l-1.6-5.2A2 2 0 0 0 16.5 9.5h-9a2 2 0 0 0-1.9 1.3L4 16z" />
        <path {...stroke} d="M3 16v2m18-2v2M8 9.5L9 7h6l1 2.5" />
        <motion.g style={{ originX: "7.5px", originY: "17px" }} animate={roll ? { rotate: 360 } : { rotate: 0 }} transition={roll ? { duration: 1.4, repeat: 1, ease: "linear" } : undefined}>
          <circle cx="7.5" cy="17" r="1.8" fill="currentColor" />
          <path {...stroke} strokeWidth={1} d="M7.5 15.2v3.6" stroke="var(--paper)" />
        </motion.g>
        <motion.g style={{ originX: "16.5px", originY: "17px" }} animate={roll ? { rotate: 360 } : { rotate: 0 }} transition={roll ? { duration: 1.4, repeat: 1, ease: "linear" } : undefined}>
          <circle cx="16.5" cy="17" r="1.8" fill="currentColor" />
          <path {...stroke} strokeWidth={1} d="M16.5 15.2v3.6" stroke="var(--paper)" />
        </motion.g>
      </motion.g>
    </svg>
  );
}

export function TrainGlyph({ size = 18, className = "" }: { size?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <motion.g initial={reduce ? false : { x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 16 }}>
        <rect {...stroke} x="5" y="3" width="14" height="14" rx="3" />
        <path {...stroke} d="M5 11h14M9 21l-1 1m8-1l1 1M9 15h.01M15 15h.01" />
      </motion.g>
    </svg>
  );
}

export function PinGlyph({ size = 18, className = "" }: { size?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <motion.g initial={reduce ? false : { y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14 }}>
        <path {...stroke} d="M12 22s7-7.1 7-12a7 7 0 1 0-14 0c0 4.9 7 12 7 12z" />
        <circle cx="12" cy="10" r="2.5" {...stroke} />
      </motion.g>
    </svg>
  );
}

export function ScanGlyph({ size = 18, className = "" }: { size?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />
      <motion.line x1="6" x2="18" y1="8" y2="8" {...stroke} strokeWidth={1.5} animate={reduce ? { y: 4, opacity: 0.9 } : { y: [0, 9, 0], opacity: [0.2, 1, 0.2] }} transition={loop(2.2, 0.8)} />
    </svg>
  );
}

export function WalkGlyph({ size = 18, className = "" }: { size?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <motion.g style={{ originX: "12px", originY: "22px" }} animate={reduce ? { y: 0 } : { y: [0, -1.5, 0], rotate: [0, 2, 0] }} transition={loop(0.9)}>
        <circle cx="13" cy="4" r="1.6" fill="currentColor" />
        <path {...stroke} d="M9 21l2-6 2 2v4M8 12l3-3 2 1 3 3M11 9l-2 6" />
      </motion.g>
    </svg>
  );
}

export function CoffeeGlyph({ size = 18, className = "" }: { size?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <path {...stroke} d="M4 10h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-5zM16 12h1.5a2.5 2.5 0 0 1 0 5H16" />
      {[7, 10, 13].map((x, i) => (
        <motion.path
          key={x}
          {...stroke}
          strokeWidth={1.5}
          d={`M${x} 7c0-1 1-1 1-2s-1-1-1-2`}
          animate={reduce ? { opacity: 0.7 } : { y: [0, -3], opacity: [0, 0.9, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
        />
      ))}
    </svg>
  );
}

export function TicketGlyph({ size = 18, className = "" }: { size?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <motion.g style={{ originX: "12px", originY: "12px" }} animate={reduce ? { rotate: 0 } : { rotate: [0, -6, 6, 0] }} transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }}>
        <path {...stroke} d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" />
        <path {...stroke} strokeDasharray="2 2" d="M14 6v12" />
      </motion.g>
    </svg>
  );
}

export function DoorGlyph({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...stroke} d="M4 21V5a2 2 0 0 1 2-2h8v18M14 21H4M14 3l6 2v16l-6-2" />
      <circle cx="11" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

/** A plane that crosses a box on an arc, leaving a faint dotted trail. */
export function PlaneFlight({ play, delay = 0, tone = "var(--ink)", className = "" }: { play: boolean; delay?: number; tone?: string; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  const path = "M-20 200 C 90 190, 220 140, 420 60";
  return (
    <svg viewBox="0 0 390 220" preserveAspectRatio="none" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden="true">
      <motion.path
        d={path}
        fill="none"
        stroke={tone}
        strokeWidth="2.5"
        strokeDasharray="0.5 9"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={play ? { opacity: [0, 0.35, 0.35, 0] } : { opacity: 0 }}
        transition={{ duration: 2.4, times: [0, 0.2, 0.7, 1], delay, ease: "easeInOut" }}
      />
      <motion.g
        initial={{ offsetDistance: "0%", opacity: 0 }}
        animate={play ? { offsetDistance: ["0%", "100%"], opacity: [0, 1, 1, 0] } : { offsetDistance: "0%", opacity: 0 }}
        transition={{ duration: 1.7, times: [0, 0.1, 0.85, 1], delay, ease: [0.4, 0, 0.3, 1] }}
        style={{ offsetPath: `path("${path}")`, offsetRotate: "auto" }}
      >
        <path fill={tone} transform="rotate(45) translate(-12 -12) scale(1.25)" d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </motion.g>
    </svg>
  );
}
