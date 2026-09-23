"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { GateSlider } from "@/components/GateSlider";
import { PinGlyph, PlaneFlight, PlaneGlyph } from "@/components/Glyphs";
import { PlanChapters } from "@/components/PlanChapters";
import { Chip, Seg, perkOptions } from "@/components/PlanForm";
import { RollingNumber } from "@/components/RollingNumber";
import { LINES, Orbit } from "@/components/Searching";
import { DemoActions, DemoRide } from "@/components/landing/DemoPlan";
import { Rise } from "@/components/landing/Rise";
import { demoPlan } from "@/lib/demo-plan";
import { parseFlightNumber } from "@/lib/flight-utils";
import { deviceTz, fmtDay, fmtTime, fmtTimeShort } from "@/lib/format";
import { planRows } from "@/lib/plan-rows";
import type { Mode, Perks } from "@/types/plan";

function Step({ n, title, body, children, flip = false }: { n: string; title: string; body: ReactNode; children: ReactNode; flip?: boolean }) {
  return (
    <div className={`grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-14 [&>*]:min-w-0 ${flip ? "md:[&>*:first-child]:order-2" : ""}`}>
      <Rise>
        <p className="font-display text-[44px] font-normal italic leading-none text-coral">{n}</p>
        <h3 className="display-soft mt-3 text-[30px] leading-[1.05] md:text-[38px]">{title}</h3>
        <p className="mt-4 max-w-[42ch] text-[16.5px] leading-relaxed text-ink-2">{body}</p>
      </Rise>
      <Rise delay={0.08}>
        <div className="mx-auto w-full max-w-[380px] rounded-[32px] border border-line bg-ground p-3 sm:p-4" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 24px 48px -32px rgba(31,32,48,0.35)" }}>
          {children}
        </div>
      </Rise>
    </div>
  );
}

/** The real form controls, wired to nothing but themselves. Play with them. */
function StepForm() {
  const [flight, setFlight] = useState("");
  const [date, setDate] = useState<"today" | "tomorrow">("today");
  const [mode, setMode] = useState<Mode>("ride");
  const [bag, setBag] = useState(false);
  const [perks, setPerks] = useState<Perks>({ precheck: true, clear: false, globalEntry: false, touchlessId: false });
  const [buffer, setBuffer] = useState(30);
  const valid = Boolean(parseFlightNumber(flight));
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="label" htmlFor="tour-flight">
          Your flight
        </label>
        <div className="field">
          <span className="shrink-0 text-coral">
            <PlaneGlyph size={22} takeoff={valid} key={valid ? flight.trim() : "idle"} />
          </span>
          <input id="tour-flight" value={flight} placeholder="DL 405" className="uppercase" autoCapitalize="characters" autoCorrect="off" spellCheck={false} onChange={(e) => setFlight(e.target.value.toUpperCase())} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {(["today", "tomorrow"] as const).map((d) => (
            <motion.button key={d} type="button" className="chip justify-center" aria-pressed={date === d} whileTap={{ scale: 0.96 }} onClick={() => setDate(d)}>
              {date === d ? <Check className="h-4 w-4" /> : null}
              {d === "today" ? "Today" : "Tomorrow"}
            </motion.button>
          ))}
        </div>
      </div>
      <div>
        <span className="label">Leaving from</span>
        <div className="field">
          <span className="shrink-0 text-coral">
            <PinGlyph size={20} />
          </span>
          <span className="flex-1 truncate text-[15px] font-medium">Silver Lake, Los Angeles</span>
          <span className="rounded-full bg-ground px-2 py-0.5 text-[11px] font-semibold text-ink-2">Home</span>
        </div>
      </div>
      <div>
        <span className="label">Getting there</span>
        <Seg
          id="tour-mode"
          options={[
            { key: "ride", label: "Rideshare" },
            { key: "drive", label: "Driving" },
            { key: "transit", label: "Transit" },
          ]}
          value={mode}
          onChange={setMode}
          label="How you're getting to the airport"
          cols={3}
        />
      </div>
      <div>
        <span className="label">Checking a bag?</span>
        <Seg
          id="tour-bag"
          options={[
            { key: "no", label: "No" },
            { key: "yes", label: "Yes" },
          ]}
          value={bag ? "yes" : "no"}
          onChange={(v) => setBag(v === "yes")}
          label="Checking a bag"
        />
      </div>
      <div>
        <span className="label">Skip the line</span>
        <div className="flex flex-wrap gap-2">
          {perkOptions.map((p) => (
            <Chip key={p.key} pressed={perks[p.key]} onClick={() => setPerks({ ...perks, [p.key]: !perks[p.key] })}>
              {p.label}
            </Chip>
          ))}
        </div>
      </div>
      <GateSlider id="tour-gate" compact value={buffer} onChange={setBuffer} />
    </div>
  );
}

const CHECKS = [
  "Flight status, terminal, and gate",
  "Live traffic on your route, at your leave time",
  "Today's wait at your checkpoint and lane",
  "Closures, construction, events, weather",
  "The walk from security to your gate",
  "Your airline's bag-drop cutoff",
];

function StepSearch() {
  const reduce = useReducedMotion();
  const [line, setLine] = useState(2);
  const [pass, setPass] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setLine((l) => (l >= 5 ? 2 : l + 1)), 1800);
    const p = setInterval(() => setPass((k) => k + 1), 5600);
    return () => {
      clearInterval(t);
      clearInterval(p);
    };
  }, [reduce]);
  const text = LINES[line];
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-[220px]">
        <Orbit still={Boolean(reduce)} />
        {reduce ? null : <PlaneFlight key={pass} play delay={0.6} />}
      </div>
      <div className="mt-1 flex h-7 items-center justify-center" aria-live="off">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={text.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="text-[14.5px] text-ink-2">
            {text.text}
          </motion.p>
        </AnimatePresence>
      </div>
      <motion.ul
        className="mt-5 w-full space-y-2 text-left"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px 0px" }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.14, delayChildren: 0.2 } } }}
      >
        {CHECKS.map((c) => (
          <motion.li
            key={c}
            variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 260, damping: 24 } } }}
            className="flex items-center gap-3 rounded-[16px] border border-line bg-paper px-3.5 py-2.5 text-[14px] font-medium"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 8px 16px -14px rgba(31,32,48,0.35)" }}
          >
            <motion.span
              variants={{ hidden: { scale: 0 }, show: { scale: 1, transition: { type: "spring", stiffness: 400, damping: 18, delay: 0.25 } } }}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sage-soft text-ink"
            >
              <Check className="h-3.5 w-3.5" />
            </motion.span>
            {c}
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

/** The plan, with the slider that moves it. */
function StepPlan() {
  const [now] = useState(() => Date.now());
  const [buffer, setBuffer] = useState(30);
  const tz = deviceTz() || "America/Los_Angeles";
  const plan = useMemo(() => demoPlan({ now, tz, bufferMinutes: buffer }), [now, tz, buffer]);
  const { rows, total, latestISO } = planRows(plan);
  const leave = fmtTime(plan.leaveISO, tz);
  const day = fmtDay(plan.leaveISO, tz);
  return (
    <div className="flex flex-col gap-3">
      <div className="card text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-2">Leave by</p>
        <div className="display-soft mt-1 flex items-baseline justify-center gap-1.5 font-display text-[54px] font-semibold leading-none tracking-[-0.03em]">
          <RollingNumber value={leave.hm} />
          <span className="font-sans text-[14px] font-semibold tracking-[0.06em] text-ink-2">{leave.ampm}</span>
        </div>
        <p className="mt-1.5 text-[13px] text-ink-2">
          {day.rel ?? day.pretty} · Absolute latest <b className="font-semibold text-ink">{fmtTimeShort(latestISO, tz)}</b>
        </p>
      </div>
      <GateSlider id="tour-spare" compact value={buffer} onChange={setBuffer} />
      <div className="pt-1">
        <div className="flex items-baseline justify-between px-1">
          <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-3">The plan</h4>
          <span className="text-[12.5px] text-ink-2">
            Door to departure{" "}
            <b className="font-semibold tabular-nums text-ink">
              {Math.floor(total / 60)}h {total % 60}m
            </b>
          </span>
        </div>
        <div className="mt-3">
          <PlanChapters chapters={rows.map((r) => ({ key: r.key, iso: r.iso, title: r.title, segLabel: r.seg?.label, segMin: r.seg?.min, lead: r.lead, notes: r.notes }))} mode="ride" tz={tz} latestISO={latestISO} isToday={false} />
        </div>
      </div>
    </div>
  );
}

function StepGo({ site }: { site: string }) {
  const [now] = useState(() => Date.now());
  const tz = deviceTz() || "America/Los_Angeles";
  const plan = useMemo(() => demoPlan({ now, tz }), [now, tz]);
  const f = plan.flight;
  const og = new URLSearchParams({
    leave: fmtTimeShort(plan.leaveISO, tz),
    day: fmtDay(plan.leaveISO, tz).pretty,
    flight: f.flightNumber,
    airline: f.airlineCode,
    route: `${f.departureAirport} → ${f.destinationAirportCode}`,
    dep: fmtTimeShort(f.departureTime, tz),
    terminal: f.terminal ?? "",
    spare: String(plan.bufferMinutes),
  });
  return (
    <div className="flex flex-col gap-3">
      <DemoRide plan={plan} />
      <DemoActions plan={plan} planUrl={`${site}/app`} />
      <div className="card !p-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/og?${og.toString()}`} alt="The preview card a shared plan shows in Messages, Slack, and X" width={1200} height={630} className="w-full rounded-[16px] border border-line" loading="lazy" />
        <p className="mt-2 px-1 text-center text-[12.5px] text-ink-3">Send it to whoever&rsquo;s coming. Everyone sees the same time, so nobody has to nag.</p>
      </div>
    </div>
  );
}

export function Tour({ site }: { site: string }) {
  return (
    <div className="flex flex-col gap-20 md:gap-28">
      <Step n="01" title="Tell it once." body="Flight number. Where you're leaving from. How you're getting there. No spreadsheet, no group-chat debate. It remembers you next time.">
        <StepForm />
      </Step>
      <Step n="02" title="Let it do the worrying." body="Live traffic on your route. Today's wait at your checkpoint. Closures, construction, the walk to your gate. Everything you'd lie awake running through, checked for you, right now." flip>
        <StepSearch />
      </Step>
      <Step n="03" title="See exactly why." body={<>Every step has a time and a reason, so the number feels earned, not arbitrary. Slide the spare time to match your nerves. The absolute latest is the line you never cross.</>}>
        <StepPlan />
      </Step>
      <Step n="04" title="Walk out the door sure." body="One tap books a ride to your terminal, not the rental lot. A reminder, so you can stop watching the clock. Share it, and the &ldquo;should we go yet?&rdquo; argument is over." flip>
        <StepGo site={site} />
      </Step>
    </div>
  );
}
