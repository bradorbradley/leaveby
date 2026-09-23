"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";

import { GateSlider } from "@/components/GateSlider";
import { RollingNumber } from "@/components/RollingNumber";
import { demoPlan } from "@/lib/demo-plan";
import { deviceTz, fmtTime, fmtTimeShort } from "@/lib/format";
import { planRows } from "@/lib/plan-rows";

const ITEMS = [
  { key: "leave", emoji: "🚗", title: "Your commute", note: "Live traffic from your door" },
  { key: "arrive", emoji: "🧳", title: "Curb to security", note: "Your terminal" },
  { key: "security", emoji: "🛂", title: "Security", note: "Today's wait for your lane" },
  { key: "gate", emoji: "🚶", title: "Walk to the gate", note: "How far your gate is" },
  { key: "spare", emoji: "☕", title: "Spare time", note: "You choose" },
  { key: "boarding", emoji: "🎫", title: "Boarding", note: "When your airline boards" },
] as const;

/** What goes into the time, with a sample trip's real minutes, and the answer it adds up to. */
export function Checks() {
  const reduce = useReducedMotion();
  const [now] = useState(() => Date.now());
  const [buffer, setBuffer] = useState(30);
  const tz = deviceTz() || "America/Los_Angeles";
  const plan = useMemo(() => demoPlan({ now, tz, bufferMinutes: buffer }), [now, tz, buffer]);
  const { rows, latestISO } = planRows(plan);
  // Spare time shows what you chose; the few minutes from rounding the leave time down are a bonus.
  const minutes = (key: string) => (key === "spare" ? buffer : rows.find((r) => r.key === key)?.seg?.min ?? 0);
  const leave = fmtTime(plan.leaveISO, tz);

  return (
    <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-8 [&>*]:min-w-0">
      <motion.ul
        className="card !p-2"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px 0px" }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.08 } } }}
      >
        {ITEMS.map((item, i) => (
          <motion.li
            key={item.key}
            variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 260, damping: 26 } } }}
            className={`flex items-center gap-3.5 px-3 py-3 ${i ? "border-t border-line" : ""}`}
          >
            <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ground text-[22px]">
              {item.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-[15.5px] font-semibold">{item.title}</b>
              <span className="block text-[13.5px] text-ink-2">{item.note}</span>
            </span>
            <b className="shrink-0 text-[15px] font-semibold tabular-nums">{minutes(item.key)} min</b>
          </motion.li>
        ))}
      </motion.ul>

      <div className="flex flex-col gap-3">
        <div
          className="rounded-[24px] px-5 pb-5 pt-4 text-paper"
          style={{ backgroundImage: "linear-gradient(180deg, #2e2f44 0%, var(--ink) 60%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 24px 48px -28px rgba(31,32,48,0.6)" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-paper/75">Leave by</p>
          <p className="display-soft mt-1 font-display text-[56px] font-semibold leading-none tracking-[-0.02em]">
            <RollingNumber value={leave.hm} /> <span className="font-sans text-[16px] font-semibold tracking-[0.06em] text-paper/75">{leave.ampm}</span>
          </p>
          <p className="mt-4 border-t border-white/10 pt-3 text-[15px] font-semibold tabular-nums" style={{ color: "var(--mustard-soft)" }}>
            Absolute latest {fmtTimeShort(latestISO, tz)}
          </p>
          <p className="mt-0.5 text-[13.5px] text-paper/75">The latest you can leave and still make your flight.</p>
        </div>
        <GateSlider id="landing-spare" compact value={buffer} onChange={setBuffer} />
      </div>
    </div>
  );
}
