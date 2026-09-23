"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { Rise } from "@/components/landing/Rise";
import { RollingNumber } from "@/components/RollingNumber";
import { DEMO_RESEARCH, demoPlan } from "@/lib/demo-plan";
import { deviceTz, fmtTime, fmtTimeShort } from "@/lib/format";
import { planRows } from "@/lib/plan-rows";

const FINDINGS: Array<{ text: string; source: string; critical?: boolean }> = [
  { text: "405 South: one lane closed at Century Blvd until 6 AM. The Sepulveda exit is slow.", source: "Caltrans advisory, this morning", critical: true },
  { text: "Terminal 7 PreCheck is running about 15 minutes right now.", source: "TSA wait times" },
  { text: "UA 1523 is on time. Gate 73B, at the far end of the terminal.", source: "United flight status" },
  { text: "38 minutes door to curb with traffic at your leave time. 27 in free flow.", source: "Live routing" },
];

/** Findings from the sample morning, one at a time, each with where it came from. */
function Findings() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((k) => (k + 1) % FINDINGS.length), 3400);
    return () => clearInterval(t);
  }, [reduce]);
  const f = FINDINGS[i];
  return (
    <div className="relative min-h-[132px]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="rounded-[16px] px-3.5 py-3 text-[14px] font-medium leading-snug"
          style={
            f.critical
              ? { background: "var(--mustard-soft)", color: "#1F2030", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }
              : { background: "var(--ground)", color: "#1F2030", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)" }
          }
        >
          <div className="flex items-start gap-2">
            {f.critical ? (
              <span aria-hidden="true" className="text-[15px] leading-none">
                ⚠️
              </span>
            ) : null}
            <span>{f.text}</span>
          </div>
          <p className="mt-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-2">{f.source}</p>
        </motion.div>
      </AnimatePresence>
      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {FINDINGS.map((_, k) => (
          <motion.i key={k} className="block h-1.5 w-1.5 rounded-full bg-ink" animate={{ opacity: k === i ? 1 : 0.25, scale: k === i ? 1.4 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} />
        ))}
      </div>
    </div>
  );
}

const RAMP = ["#1F2030", "#4A3A4C", "#A6544A", "#E4806A", "#F2B9AA", "#F8DED5"];

/** Where the minutes go, drawn to scale. */
function Breakdown() {
  const reduce = useReducedMotion();
  const r = DEMO_RESEARCH;
  const parts = [
    { label: "Drive", min: r.driveMinutes },
    { label: "Curb to security", min: r.curbToCheckpointMinutes },
    { label: "Security", min: r.securityMinutes },
    { label: "Walk to gate", min: r.checkpointToGateMinutes },
    { label: "Spare time", min: 30 },
    { label: "Boarding to doors", min: r.boardingLeadMinutes },
  ];
  const total = parts.reduce((s, p) => s + p.min, 0);
  return (
    <motion.ul className="space-y-2" initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px 0px" }} variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.1 } } }}>
      {parts.map((p, i) => (
        <motion.li key={p.label} variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex items-center gap-3 text-[13.5px]">
          <span className="w-[118px] shrink-0 font-medium text-ink-2">{p.label}</span>
          <span className="relative h-[22px] flex-1 overflow-hidden rounded-full bg-ground">
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: RAMP[i], boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)" }}
              variants={{ hidden: { width: 0 }, show: { width: `${Math.max(8, (p.min / total) * 100)}%`, transition: { type: "spring", stiffness: 120, damping: 22 } } }}
            />
          </span>
          <b className="w-[54px] shrink-0 text-right font-semibold tabular-nums">{p.min} min</b>
        </motion.li>
      ))}
      <li className="flex items-center justify-between border-t border-line pt-2.5 text-[13.5px]">
        <span className="font-medium text-ink-2">Door to departure</span>
        <b className="font-semibold tabular-nums">
          {Math.floor(total / 60)}h {total % 60}m
        </b>
      </li>
    </motion.ul>
  );
}

function Latest() {
  const [now] = useState(() => Date.now());
  const tz = deviceTz() || "America/Los_Angeles";
  const plan = useMemo(() => demoPlan({ now, tz, checkedBag: true }), [now, tz]);
  const { latestISO } = planRows(plan);
  const leave = fmtTime(plan.leaveISO, tz);
  return (
    <div>
      <div className="rounded-[20px] bg-ink px-4 pb-4 pt-3.5 text-paper" style={{ backgroundImage: "linear-gradient(180deg, #2e2f44 0%, var(--ink) 60%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-paper/75">Leave by</p>
        <p className="display-soft mt-1 font-display text-[44px] font-semibold leading-none tracking-[-0.02em]">
          <RollingNumber value={leave.hm} /> <span className="font-sans text-[14px] font-semibold tracking-[0.06em] text-paper/75">{leave.ampm}</span>
        </p>
        <p className="mt-2 text-[13.5px] font-semibold tabular-nums" style={{ color: "var(--mustard-soft)" }}>
          Absolute latest {fmtTimeShort(latestISO, tz)}
        </p>
      </div>
      <ul className="mt-3 space-y-1.5 text-[13.5px] leading-snug text-ink-2">
        <li>Leave times round down to a clean five minutes, never up.</li>
        <li>A bag-drop cutoff sets the time when it has to, and the plan says so.</li>
        <li>Spare time is yours to set, from 10 to 90 minutes.</li>
      </ul>
    </div>
  );
}

const CARDS = [
  { title: "Live, not averaged.", body: "Traffic is measured on your route at your leave time. Security waits are today's, for your checkpoint and lane. Notices are from this morning.", demo: <Findings /> },
  { title: "Every minute explained.", body: "Each step shows how long it takes and why. If the walk to your gate is long, the plan tells you which gates and how far.", demo: <Breakdown /> },
  { title: "Early by design.", body: "The plan is conservative where it matters and honest about the margin, so you always know the line you cannot cross.", demo: <Latest /> },
];

export function Trust() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {CARDS.map((c, i) => (
        <Rise key={c.title} delay={i * 0.08}>
          <div className="card flex h-full flex-col !p-5">
            <h3 className="display-soft text-[26px] leading-tight">{c.title}</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{c.body}</p>
            <div className="mt-5">{c.demo}</div>
          </div>
        </Rise>
      ))}
    </div>
  );
}
