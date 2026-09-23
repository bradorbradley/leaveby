"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { STAR } from "@/components/Mark";
import { fmtTimeShort } from "@/lib/format";
import type { Progress } from "@/hooks/usePlan";

/**
 * One line at a time. It advances on real progress events when they arrive
 * and on a timer when they don't, so it never looks stuck.
 */
const LINES: Array<{ key: string; text: string }> = [
  { key: "flight", text: "Finding your flight" },
  { key: "route", text: "Mapping the drive" },
  { key: "traffic", text: "Looking at live traffic on your route" },
  { key: "security", text: "Checking security lines at the terminal" },
  { key: "rules", text: "Measuring the walk from security to your gate" },
  { key: "today", text: "Scanning today's airport news and weather" },
  { key: "synthesis", text: "Putting it together" },
];

/** Two circles breathe past each other; their overlap is the lens. A star turns slowly above. */
function Orbit({ still }: { still: boolean }) {
  const ease = "easeInOut" as const;
  return (
    <svg viewBox="0 0 260 260" width="220" height="220" aria-hidden="true" className="overflow-visible">
      <g style={{ mixBlendMode: "multiply" }}>
        <motion.circle
          r="72"
          cy="150"
          fill="var(--coral-pale)"
          animate={still ? { cx: 106 } : { cx: [84, 118, 84] }}
          transition={still ? { duration: 0.6 } : { duration: 5.2, repeat: Infinity, ease }}
        />
        <motion.circle
          r="72"
          cy="150"
          fill="var(--coral-soft)"
          animate={still ? { cx: 154 } : { cx: [176, 142, 176] }}
          transition={still ? { duration: 0.6 } : { duration: 5.2, repeat: Infinity, ease }}
        />
      </g>
      <motion.g
        style={{ originX: "130px", originY: "78px" }}
        animate={still ? { rotate: 0, scale: 1 } : { rotate: 360 }}
        transition={still ? { duration: 0.8 } : { duration: 26, repeat: Infinity, ease: "linear" }}
      >
        <path d={STAR} transform="translate(93 41) scale(0.74)" fill="var(--mustard)" />
      </motion.g>
      <circle cx="130" cy="78" r="5" fill="var(--paper)" />
      <motion.circle
        cx="130"
        cy="150"
        r="6"
        fill="var(--ink)"
        animate={still ? { scale: 1 } : { scale: [1, 1.5, 1] }}
        transition={still ? { duration: 0.4 } : { duration: 2.6, repeat: Infinity, ease }}
        style={{ originX: "130px", originY: "150px" }}
      />
    </svg>
  );
}

export function Searching({ progress, flightNumber, onCancel }: { progress: Progress; flightNumber: string; onCancel: () => void }) {
  const reduce = useReducedMotion();
  const f = progress.flight;
  const tz = f?.departureTimezone ?? "America/New_York";

  // Real signals: flight found, route mapped, synthesis started. The searches
  // run in parallel, so while they're in flight the line cycles through them.
  const floor = useMemo(() => {
    let i = 0;
    if (f) i = 1;
    if (progress.route) i = 2;
    return i;
  }, [f, progress.route]);
  const synthesizing = progress.stages.includes("synthesis");

  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown((s) => Math.max(s, floor));
  }, [floor]);
  useEffect(() => {
    if (synthesizing) setShown(6);
  }, [synthesizing]);
  useEffect(() => {
    const t = setInterval(() => {
      setShown((s) => {
        if (synthesizing) return 6;
        if (s < floor) return floor;
        if (s < 2) return s + 1;
        return s >= 5 ? 2 : s + 1;
      });
    }, 2000);
    return () => clearInterval(t);
  }, [floor, synthesizing]);

  const line = LINES[Math.min(shown, LINES.length - 1)];

  return (
    <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 24 }} className="mb-6">
        <Orbit still={Boolean(reduce) || synthesizing} />
      </motion.div>
      <h2 className="display-soft text-[30px] leading-tight">{f ? `Checking ${f.departureAirport} right now` : `Finding ${flightNumber}`}</h2>

      <div className="mt-3 flex h-7 items-center justify-center" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={line.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="text-[15px] text-ink-2"
          >
            {line.text}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex gap-2" aria-hidden="true">
        {LINES.slice(2).map((l, i) => (
          <motion.span
            key={l.key}
            animate={{ scale: shown === i + 2 || shown === 6 ? 1.35 : 1, backgroundColor: shown === i + 2 || shown === 6 ? "var(--coral)" : "var(--coral-pale)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="h-1.5 w-1.5 rounded-full"
          />
        ))}
      </div>

      {f ? (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-full border border-line bg-paper px-4 py-2 text-[13px] font-medium text-ink-2 shadow-card"
        >
          {f.flightNumber} · {f.departureAirport}
          {f.terminal ? ` Terminal ${f.terminal}` : ""} · {fmtTimeShort(f.departureTime, tz)}
        </motion.p>
      ) : null}

      <button type="button" onClick={onCancel} className="mt-10 text-[14px] font-medium text-ink-3">
        Never mind
      </button>
    </div>
  );
}
