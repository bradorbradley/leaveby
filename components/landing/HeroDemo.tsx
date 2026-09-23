"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PinGlyph, PlaneFlight, PlaneGlyph } from "@/components/Glyphs";
import { LINES, Orbit } from "@/components/Searching";
import { DemoFlightCard, DemoHeroCard, DemoRide } from "@/components/landing/DemoPlan";
import { Phone } from "@/components/landing/Phone";
import { demoPlan } from "@/lib/demo-plan";
import { deviceTz } from "@/lib/format";

type Phase = "form" | "search" | "plan";
const FLIGHT = "UA 1523";

/**
 * The whole app in one loop: the flight number types itself, the search
 * runs, the time lands. Then it does it again. Every piece is the real
 * component with real numbers a few hours ahead of right now.
 */
export function HeroDemo() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(reduce ? "plan" : "form");
  const [typed, setTyped] = useState(reduce ? FLIGHT : "");
  const [precheck, setPrecheck] = useState(Boolean(reduce));
  const [pressed, setPressed] = useState(false);
  const [line, setLine] = useState(2);
  const [now] = useState(() => Date.now());
  const plan = useMemo(() => demoPlan({ now, tz: deviceTz() || undefined }), [now]);

  useEffect(() => {
    if (reduce) return;
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    if (phase === "form") {
      setTyped("");
      setPrecheck(false);
      setPressed(false);
      FLIGHT.split("").forEach((_, i) => at(700 + i * 130, () => setTyped(FLIGHT.slice(0, i + 1))));
      at(2500, () => setPrecheck(true));
      at(3300, () => setPressed(true));
      at(3700, () => setPhase("search"));
    } else if (phase === "search") {
      setLine(0);
      [1, 2, 3, 4, 5, 6].forEach((i) => at(600 + i * 720, () => setLine(i)));
      at(5900, () => setPhase("plan"));
    } else {
      at(9000, () => setPhase("form"));
    }
    return () => timers.forEach(clearTimeout);
  }, [phase, reduce]);

  const ready = typed.length === FLIGHT.length;
  const text = LINES[Math.min(line, LINES.length - 1)];

  return (
    <Phone height={660}>
      <AnimatePresence mode="wait" initial={false}>
        {phase === "form" ? (
          <motion.div key="form" className="flex h-full flex-col" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.28 }}>
            <h2 className="display-soft mb-4 mt-1 text-[32px] leading-[1.02]">
              When do I need
              <br />
              to <em className="font-normal italic text-coral">leave?</em>
            </h2>
            <span className="label">Your flight</span>
            <div className="field !min-h-[52px]" aria-hidden="true">
              <span className="shrink-0 text-coral">
                <PlaneGlyph size={22} takeoff={ready} key={ready ? "go" : "idle"} />
              </span>
              <span className={`flex-1 text-[16px] font-medium ${typed ? "text-ink" : "text-ink-3"}`}>
                {typed || "DL 405"}
                {typed && !ready ? <span className="ml-px inline-block h-[18px] w-[2px] translate-y-[3px] animate-pulse bg-ink" /> : null}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5" aria-hidden="true">
              <span className="chip !min-h-[40px] justify-center text-[13px]" aria-pressed="true">
                <Check className="h-3.5 w-3.5" /> Today
              </span>
              <span className="chip !min-h-[40px] justify-center text-[13px]">Tomorrow</span>
              <span className="chip !min-h-[40px] justify-center text-[13px]">Pick</span>
            </div>
            <span className="label mt-4">Leaving from</span>
            <div className="field !min-h-[52px]" aria-hidden="true">
              <span className="shrink-0 text-coral">
                <PinGlyph size={20} />
              </span>
              <span className="flex-1 truncate text-[15px] font-medium">Silver Lake, Los Angeles</span>
              <span className="rounded-full bg-ground px-2 py-0.5 text-[11px] font-semibold text-ink-2">Home</span>
            </div>
            <span className="label mt-4">Getting there</span>
            <div className="seg" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }} aria-hidden="true">
              <button type="button" aria-pressed="true" className="!min-h-[40px] !px-1 !text-[12.5px]" tabIndex={-1}>
                <span className="absolute inset-0 rounded-[14px] bg-ink" />
                <span className="relative z-10">Rideshare</span>
              </button>
              <button type="button" className="!min-h-[40px] !px-1 !text-[12.5px]" tabIndex={-1}>
                Driving
              </button>
              <button type="button" className="!min-h-[40px] !px-1 !text-[12.5px]" tabIndex={-1}>
                Transit
              </button>
            </div>
            <span className="label mt-4">Skip the line</span>
            <div className="flex flex-wrap gap-1.5" aria-hidden="true">
              <span className="chip !min-h-[38px] !px-3 text-[13px]" aria-pressed={precheck}>
                <motion.span initial={false} animate={{ width: precheck ? 14 : 0, opacity: precheck ? 1 : 0 }} transition={{ type: "spring", stiffness: 380, damping: 32 }} className="inline-flex overflow-hidden">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                </motion.span>
                TSA PreCheck
              </span>
              <span className="chip !min-h-[38px] !px-3 text-[13px]">CLEAR</span>
            </div>
            <div className="mt-auto pt-4">
              <motion.span
                className="btn-primary !min-h-[52px] !text-[15px]"
                aria-hidden="true"
                animate={{ opacity: ready ? 1 : 0.35, scale: pressed ? 0.97 : 1 }}
                transition={{ duration: 0.2 }}
              >
                When should I leave?
              </motion.span>
            </div>
          </motion.div>
        ) : null}

        {phase === "search" ? (
          <motion.div key="search" className="flex h-full flex-col items-center justify-center pb-10 text-center" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.3 }}>
            <div className="relative mb-4 w-[240px]">
              <Orbit still={line >= 6} />
              {line >= 6 ? null : <PlaneFlight play delay={0.4} />}
            </div>
            <h2 className="display-soft text-[26px] leading-tight">{line >= 1 ? "Checking LAX right now" : `Finding ${FLIGHT}`}</h2>
            <div className="mt-3 flex h-7 items-center justify-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p key={text.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="text-[14px] text-ink-2">
                  {text.text}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="mt-4 flex gap-2" aria-hidden="true">
              {LINES.slice(2).map((l, i) => (
                <motion.span
                  key={l.key}
                  animate={{ scale: line === i + 2 || line >= 6 ? 1.35 : 1, backgroundColor: line === i + 2 || line >= 6 ? "var(--coral)" : "var(--coral-pale)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="h-1.5 w-1.5 rounded-full"
                />
              ))}
            </div>
            {line >= 1 ? (
              <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-full border border-line bg-paper px-4 py-2 text-[12.5px] font-medium text-ink-2 shadow-card">
                {FLIGHT} · LAX Terminal 7
              </motion.p>
            ) : null}
          </motion.div>
        ) : null}

        {phase === "plan" ? (
          <motion.div key="plan" className="flex flex-col gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.3 }}>
            <DemoHeroCard plan={plan} size={80} />
            <DemoFlightCard plan={plan} />
            <DemoRide plan={plan} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Phone>
  );
}
