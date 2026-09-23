"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { Mark } from "@/components/Mark";
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
  { key: "rules", text: "Reading the airline's bag and boarding rules" },
  { key: "today", text: "Scanning today's airport news and weather" },
  { key: "synthesis", text: "Putting it together" },
];

export function Searching({ progress, flightNumber, onCancel }: { progress: Progress; flightNumber: string; onCancel: () => void }) {
  const f = progress.flight;
  const tz = f?.departureTimezone ?? "America/New_York";

  // Real signals: flight found, route mapped, synthesis started. The four
  // searches run in parallel, so while they're in flight the line cycles
  // through them instead of pretending they happen one after another.
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
      <div className="relative mb-8">
        <span className="absolute -inset-5 animate-[spin_14s_linear_infinite] rounded-full border-2 border-dashed border-lilac-deep/40" />
        <Mark size={112} className="animate-bob" />
      </div>
      <h2 className="text-[26px] font-black leading-tight">{f ? `Checking ${f.departureAirport} right now` : `Finding ${flightNumber}`}</h2>

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

      <div className="mt-5 flex gap-1.5" aria-hidden="true">
        {LINES.slice(2).map((l, i) => (
          <span
            key={l.key}
            className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${shown === i + 2 || shown === 6 ? "bg-lilac-deep" : "bg-line"}`}
          />
        ))}
      </div>

      {f ? (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-full bg-paper px-4 py-2 text-[13px] font-semibold text-ink-2"
        >
          {f.flightNumber} · {f.departureAirport}
          {f.terminal ? ` Terminal ${f.terminal}` : ""} · {fmtTimeShort(f.departureTime, tz)}
        </motion.p>
      ) : null}

      <button type="button" onClick={onCancel} className="mt-10 text-[14px] font-semibold text-ink-3">
        Never mind
      </button>
    </div>
  );
}
