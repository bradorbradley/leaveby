"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

/** Ink at the moment that matters, lightening to paper by wheels-up. */
const RAMP = ["#1F2030", "#4A3A4C", "#A6544A", "#E4806A", "#F2B9AA", "#F8DED5", "#FCFAF6"];
const DARK_UNTIL = 3; // cards before this index use paper text

/** One idea per line, nothing said twice on a card. */
const COPY: Record<string, { eyebrow: string; title: string; minutes?: string }> = {
  leave: { eyebrow: "Leave by", title: "Walk out the door", minutes: "Drive" },
  arrive: { eyebrow: "Arrive by", title: "At the terminal", minutes: "To security" },
  security: { eyebrow: "In line by", title: "Security", minutes: "Wait" },
  gate: { eyebrow: "Cleared by", title: "Walk to the gate", minutes: "Walk" },
  spare: { eyebrow: "At the gate by", title: "Spare time", minutes: "Until boarding" },
  boarding: { eyebrow: "Boarding", title: "Boarding begins", minutes: "Until departure" },
  departure: { eyebrow: "Departure", title: "Wheels up" },
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
const CRITICAL = /construction|closed|closure|detour|cut ?off|closes|remote lot|shuttle|delay|strike|weather|storm|snow|rain|fog|wind|icy|ice|warning|alert|event|parade|marathon|game|concert|road ?work|lane closure|only|must|required/i;
/** All-clear phrasing ("no construction", "as normal", "not found") is reassurance, not a warning. */
const ALL_CLEAR = /\bno (?:\w+ ){0,2}(?:construction|closures?|delays?|detours?|road ?work|disruptions?|events?)\b|not found|no reports?|as normal|\bnormal\b|unaffected|open as usual/i;
export function isCritical(note: string) {
  return CRITICAL.test(note) && !ALL_CLEAR.test(note);
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
  // People don't discover sideways scrolling on their own: nudge once, label it, and give real buttons.
  const [touched, setTouched] = useState(false);
  const [nudge, setNudge] = useState(false);
  const step = () => ((scroller.current?.firstElementChild as HTMLElement | null)?.getBoundingClientRect().width ?? 0) + 10;
  const go = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    const n = Math.max(0, Math.min(chapters.length - 1, i));
    setTouched(true);
    el.scrollTo({ left: n * step(), behavior: reduce ? "auto" : "smooth" });
  };
  useEffect(() => {
    const el = scroller.current;
    if (!el || reduce) return;
    let done = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (done || !entry.isIntersecting || entry.intersectionRatio < 0.6) return;
        done = true;
        // On travel day the carousel may have moved to the current step already; that's hint enough.
        if (el.scrollLeft > 10) return io.disconnect();
        io.disconnect();
        setTimeout(() => setNudge(true), 700);
        setTimeout(() => setNudge(false), 2100);
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  // Page dots follow the scroll; on travel day the carousel opens on the step you're in.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      const w = (el.firstElementChild as HTMLElement | null)?.getBoundingClientRect().width ?? 1;
      const i = Math.round(el.scrollLeft / (w + 10));
      setActive(i);
      if (i > 0) setTouched(true);
    };
    const onTouch = () => setTouched(true);
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("pointerdown", onTouch, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerdown", onTouch);
    };
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
        className="-mx-1 flex snap-x snap-mandatory items-stretch gap-2.5 overflow-x-auto px-1 pb-2 pt-1"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch", scrollPaddingLeft: 4 }}
      >
        {chapters.map((c, i) => {
          const dark = i < DARK_UNTIL;
          const bg = RAMP[Math.min(i, RAMP.length - 1)];
          const ink = dark ? "#FCFAF6" : "#1F2030";
          const muted = dark ? "rgba(252,250,246,0.76)" : "#62606F";
          const copy = COPY[c.key] ?? { eyebrow: c.title, title: c.title };
          const minutesLabel = c.key === "leave" ? (mode === "transit" ? "Transit" : mode === "drive" ? "Drive and park" : "Drive") : copy.minutes;
          const critical = c.notes.filter(isCritical);
          const plain = c.notes.filter((n) => !isCritical(n));
          return (
            <motion.article
              key={c.key}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, x: nudge ? [0, -64, -64, 0] : 0 }}
              transition={{
                opacity: { type: "spring", stiffness: 240, damping: 26, delay: 0.35 + i * 0.07 },
                y: { type: "spring", stiffness: 240, damping: 26, delay: 0.35 + i * 0.07 },
                x: nudge ? { duration: 1.3, times: [0, 0.35, 0.55, 1], ease: "easeInOut" } : { duration: 0.2 },
              }}
              className="flex min-h-[250px] w-[86%] shrink-0 snap-start flex-col rounded-[22px] border p-4"
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
                    {copy.eyebrow}
                  </p>
                  <p className="display-soft mt-1 font-display text-[46px] font-semibold leading-none tracking-[-0.02em]">{fmtTimeShort(c.iso, tz)}</p>
                  {c.key === "leave" ? (
                    <p className="mt-2 text-[13.5px] font-semibold tabular-nums" style={{ color: "var(--mustard-soft)" }}>
                      Absolute latest {fmtTimeShort(latestISO, tz)}
                    </p>
                  ) : null}
                </div>
                <Emoji step={c.key} mode={mode} dark={dark} />
              </div>
              <p className="mt-2 text-[16px] font-semibold">{copy.title}</p>
              {minutesLabel && typeof c.segMin === "number" ? (
                <span
                  className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
                  style={{ background: dark ? "rgba(255,255,255,0.12)" : "rgba(31,32,48,0.06)", color: ink }}
                >
                  {minutesLabel} · <b className="font-semibold tabular-nums">{c.segMin} min</b>
                </span>
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

            </motion.article>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => go(active - 1)}
          disabled={active === 0}
          aria-label="Previous step"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-paper text-ink shadow-card transition-opacity disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div className="flex justify-center gap-1.5">
            {chapters.map((c, i) => (
              <button key={c.key} type="button" onClick={() => go(i)} aria-label={`Step ${i + 1}: ${(COPY[c.key] ?? { eyebrow: c.title }).eyebrow}`} className="grid h-5 w-4 place-items-center">
                <motion.i
                  className="block h-1.5 w-1.5 rounded-full"
                  animate={{ scale: active === i ? 1.5 : 1, opacity: active === i ? 1 : 0.6 }}
                  style={{ background: i === chapters.length - 1 ? "#E36F58" : RAMP[Math.min(i, RAMP.length - 1)] }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={touched ? "count" : "hint"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1 text-[12px] font-semibold text-ink-2"
            >
              {touched ? (
                `Step ${active + 1} of ${chapters.length}`
              ) : (
                <>
                  Swipe for all {chapters.length} steps
                  <motion.span animate={reduce ? undefined : { x: [0, 4, 0] }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }} className="inline-flex">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </motion.span>
                </>
              )}
            </motion.p>
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={() => go(active + 1)}
          disabled={active >= chapters.length - 1}
          aria-label="Next step"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-paper shadow-card transition-opacity disabled:opacity-30"
          style={{ backgroundImage: "linear-gradient(180deg, #2e2f44 0%, var(--ink) 60%)" }}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
