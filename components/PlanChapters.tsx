"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { fmtTimeShort } from "@/lib/format";
import type { Mode } from "@/types/plan";

export interface Chapter {
  key: string;
  iso: string;
  title: string;
  segLabel?: string;
  segMin?: number;
  lead?: string;
  notes: string[];
}

/** Warm paper at the start of the evening, ink by wheels-up. */
const RAMP = ["#FCFAF6", "#F8DED5", "#F2B9AA", "#E4806A", "#B85A4E", "#5C3F4F", "#1F2030"];
const DARK_FROM = 3; // cards at this index and beyond use paper text

const LABELS: Record<string, string> = {
  leave: "Leave by",
  arrive: "Arrive by",
  security: "In line by",
  gate: "Cleared by",
  spare: "At gate by",
  boarding: "Boarding",
  departure: "Departure",
};

const EMOJI: Record<string, string> = {
  arrive: "🧳",
  security: "🛂",
  gate: "🚶",
  spare: "☕",
  boarding: "🎫",
  departure: "✈️",
};

/** Things you must not miss: closures, cutoffs, detours, remote lots, weather, events. */
const CRITICAL = /construction|closed|closure|detour|cut ?off|closes|remote lot|shuttle|delay|strike|weather|storm|snow|rain|alert|event|parade|marathon|game|concert|road ?work|lane closure|only|must|required/i;
export function isCritical(note: string) {
  return CRITICAL.test(note);
}

function Emoji({ step, mode, dark }: { step: string; mode: Mode; dark: boolean }) {
  const reduce = useReducedMotion();
  const glyph = step === "leave" ? (mode === "transit" ? "🚆" : "🚗") : EMOJI[step] ?? "•";
  const loop = { duration: 2.2, repeat: Infinity, ease: "easeInOut" as const };
  let animate: Record<string, number[]> = { y: [0, -3, 0] };
  let transition: Record<string, unknown> = loop;
  switch (step) {
    case "leave":
      animate = { x: [0, 6, 0], rotate: [0, -3, 0] };
      break;
    case "arrive":
      animate = { y: [0, -5, 0], rotate: [0, -6, 0] };
      break;
    case "security":
      animate = { scale: [1, 1.12, 1] };
      break;
    case "gate":
      animate = { y: [0, -2, 0], rotate: [0, 6, -6, 0] };
      transition = { duration: 0.9, repeat: Infinity, ease: "easeInOut" };
      break;
    case "spare":
      animate = { rotate: [0, -8, 8, 0] };
      transition = { duration: 1.6, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" };
      break;
    case "boarding":
      animate = { rotate: [0, -10, 10, 0] };
      transition = { duration: 0.9, repeat: Infinity, repeatDelay: 2.4, ease: "easeInOut" };
      break;
    case "departure":
      animate = { x: [0, 10, 26, -18, 0], y: [0, -6, -22, 10, 0] };
      transition = { duration: 2.2, times: [0, 0.35, 0.6, 0.65, 1], repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" };
      break;
  }
  return (
    <span
      aria-hidden="true"
      className="grid h-12 w-12 place-items-center rounded-full text-[26px] leading-none"
      style={{ background: dark ? "rgba(255,255,255,0.12)" : "rgba(31,32,48,0.06)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)" }}
    >
      <motion.span className="inline-block" animate={reduce ? undefined : animate} transition={transition}>
        {glyph}
      </motion.span>
    </span>
  );
}

export function PlanChapters({
  chapters,
  mode,
  tz,
  latestISO,
  isToday,
}: {
  chapters: Chapter[];
  mode: Mode;
  tz: string;
  latestISO: string;
  isToday: boolean;
}) {
  const reduce = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Page dots follow the scroll; on travel day the carousel opens on the step you're in.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      const w = (el.firstElementChild as HTMLElement | null)?.getBoundingClientRect().width ?? 1;
      setActive(Math.round(el.scrollLeft / (w + 10)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!isToday) return;
    const el = scroller.current;
    if (!el) return;
    const now = Date.now();
    let i = 0;
    chapters.forEach((c, j) => {
      if (new Date(c.iso).getTime() <= now) i = j;
    });
    if (i > 0) {
      const w = (el.firstElementChild as HTMLElement | null)?.getBoundingClientRect().width ?? 0;
      el.scrollTo({ left: i * (w + 10), behavior: reduce ? "auto" : "smooth" });
    }
  }, [isToday, chapters, reduce]);

  return (
    <div>
      <div
        ref={scroller}
        className="-mx-5 flex snap-x snap-mandatory items-start gap-2.5 overflow-x-auto px-5 pb-2 pt-1"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {chapters.map((c, i) => {
          const dark = i >= DARK_FROM;
          const bg = RAMP[Math.min(i, RAMP.length - 1)];
          const ink = dark ? "#FCFAF6" : "#1F2030";
          const muted = dark ? "rgba(252,250,246,0.72)" : "#62606F";
          const next = chapters[i + 1];
          const critical = c.notes.filter(isCritical);
          const plain = c.notes.filter((n) => !isCritical(n));
          return (
            <motion.article
              key={c.key}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 26, delay: 0.35 + i * 0.07 }}
              className="flex min-h-[236px] w-[82%] shrink-0 snap-start flex-col rounded-[24px] border p-4"
              style={{
                background: bg,
                color: ink,
                borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(31,32,48,0.08)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 1px 2px rgba(31,32,48,0.05), 0 16px 32px -20px rgba(31,32,48,0.35)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: muted }}>
                    {LABELS[c.key] ?? c.title}
                  </p>
                  <p className="display-soft mt-1 font-display text-[46px] font-semibold leading-none tracking-[-0.02em]">{fmtTimeShort(c.iso, tz)}</p>
                </div>
                <Emoji step={c.key} mode={mode} dark={dark} />
              </div>
              <p className="mt-2 text-[16px] font-semibold">{c.title}</p>
              {c.segLabel && typeof c.segMin === "number" ? (
                <span
                  className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
                  style={{ background: dark ? "rgba(255,255,255,0.12)" : "rgba(31,32,48,0.06)", color: ink }}
                >
                  {c.segLabel} · <b className="font-semibold tabular-nums">{c.segMin} min</b>
                </span>
              ) : null}

              {c.key === "leave" ? (
                <div
                  className="mt-3 flex items-start gap-2 rounded-[14px] px-3 py-2.5 text-[13px] leading-snug"
                  style={{ background: "rgba(31,32,48,0.06)", color: ink }}
                >
                  <span aria-hidden="true" className="text-[15px] leading-none">
                    ⏱️
                  </span>
                  <span>
                    <b className="font-semibold">Absolute latest {fmtTimeShort(latestISO, tz)}.</b> Leave then and you reach the gate as boarding starts, with nothing spare.
                  </span>
                </div>
              ) : null}

              {critical.map((n) => (
                <div
                  key={n}
                  className="mt-2.5 flex items-start gap-2 rounded-[14px] px-3 py-2.5 text-[13.5px] font-medium leading-snug"
                  style={{ background: "var(--mustard-soft)", color: "#1F2030", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}
                >
                  <span aria-hidden="true" className="text-[15px] leading-none">
                    ⚠️
                  </span>
                  <span>{n}</span>
                </div>
              ))}
              {c.lead ? (
                <p className="mt-2.5 text-[13.5px] leading-snug" style={{ color: ink }}>
                  {c.lead}
                </p>
              ) : null}
              {plain.map((n) => (
                <p key={n} className="mt-1.5 text-[13.5px] leading-snug" style={{ color: muted }}>
                  {n}
                </p>
              ))}

              <p className="mt-auto pt-3 text-[12px]" style={{ color: muted }}>
                {next ? `Next: ${next.title} at ${fmtTimeShort(next.iso, tz)}` : "Wheels up."}
              </p>
            </motion.article>
          );
        })}
      </div>
      <div className="mt-1 flex justify-center gap-1.5" aria-hidden="true">
        {chapters.map((c, i) => (
          <motion.i
            key={c.key}
            className="block h-1.5 w-1.5 rounded-full"
            animate={{ scale: active === i ? 1.5 : 1, opacity: active === i ? 1 : 0.6 }}
            style={{ background: RAMP[Math.min(i, RAMP.length - 1)] === "#FCFAF6" ? "#E36F58" : RAMP[Math.min(i, RAMP.length - 1)] }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
        ))}
      </div>
    </div>
  );
}
