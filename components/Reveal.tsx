"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BellRing, Car, Map, Pencil, RotateCcw, Share2, TrainFront, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Countdown } from "@/components/Countdown";
import { Geometry } from "@/components/Mark";
import { PlanFields, isReady, type FormValues } from "@/components/PlanForm";
import { RollingNumber } from "@/components/RollingNumber";
import { deviceTz, fmtDay, fmtTime, fmtTimeShort, localDateString, minutesBetween, tzAbbrev } from "@/lib/format";
import { computePlan } from "@/lib/plan-math";
import type { Profile } from "@/lib/profile";
import { airlineLogoUrl, appleMapsLink, dropoffCoord, dropoffLabel, flightStatusLink, googleMapsLink, lyftLink, reminderLink, shareText, uberLink } from "@/lib/ride-links";
import type { PlanRequest, PlanResult } from "@/types/plan";

interface LiveStatus {
  status: "scheduled" | "delayed" | "cancelled" | "unknown";
  delayMinutes: number;
  gate: string | null;
  terminal: string | null;
  departureTime: string;
}

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 240, damping: 26 } },
} as const;

export function Reveal({
  result,
  request,
  values,
  onChange,
  onUpdate,
  profile,
  onReset,
  planUrl,
  sharedAt,
}: {
  result: PlanResult;
  request: PlanRequest;
  values: FormValues;
  onChange: (patch: Partial<FormValues>) => void;
  onUpdate: () => void;
  profile: Profile;
  onReset: () => void;
  planUrl: string;
  sharedAt: string | null;
}) {
  const reduce = useReducedMotion();
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [live, setLive] = useState<LiveStatus | null>(null);
  const [logoOk, setLogoOk] = useState(true);

  const f = result.flight;
  const tz = f.departureTimezone ?? "America/New_York";
  const r = result.research;
  const buffer = values.bufferMinutes;
  const plan = useMemo(
    () => computePlan({ flight: f, route: result.route, research: r, bufferMinutes: buffer, checkedBag: result.checkedBag, mode: result.mode }),
    [f, result.route, result.checkedBag, result.mode, r, buffer],
  );

  // Live status: refresh every two minutes while the reveal is open.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/flight?flight=${encodeURIComponent(f.flightNumber)}&date=${encodeURIComponent(request.date)}`);
        if (!res.ok) return;
        const json = (await res.json()) as LiveStatus;
        if (!cancelled) setLive(json);
      } catch {
        // keep the last known status
      }
    };
    void load();
    const t = setInterval(load, 120_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [f.flightNumber, request.date]);

  const leave = fmtTime(plan.leaveISO, tz);
  const day = fmtDay(plan.leaveISO, tz);
  const foreignTz = deviceTz() && deviceTz() !== tz;
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const minutesUntil = minutesBetween(new Date(clock).toISOString(), plan.leaveISO);
  const late = plan.isLate || minutesUntil < 0;
  const soon = !late && minutesUntil <= 20;
  const leaveLabel = `${leave.hm} ${leave.ampm}${day.rel === "Today" ? "" : ` ${day.rel ?? day.pretty}`}`;

  const stops = plan.timeline;
  const seg = (a: number, b: number) => minutesBetween(stops[a].iso, stops[b].iso);
  const travelLabel = result.mode === "transit" ? "Transit" : result.mode === "drive" ? "Drive + park" : "Drive";
  const arriveLabel = result.mode === "ride" ? "Curb to security" : "Terminal to security";
  const segments = [
    { label: travelLabel, min: seg(0, 1), color: "var(--ink)" },
    { label: arriveLabel, min: seg(1, 2), color: "var(--coral-pale)" },
    { label: "Security", min: seg(2, 3), color: "var(--coral)" },
    { label: "Walk", min: seg(3, 4), color: "var(--mustard)" },
    { label: "Until boarding", min: seg(4, 5), color: "var(--sage)" },
    { label: "Boarding to doors", min: seg(5, 6), color: "var(--ink-3)" },
  ];
  const total = segments.reduce((s, x) => s + x.min, 0);

  const driveNotes = r.driveNotes;
  const securityNotes = [...r.securityNotes];
  if (result.checkedBag && r.bagDropCutoffMinutes && !r.securityNotes.some((n) => /bag/i.test(n))) {
    securityNotes.push(`Bag drop closes ${r.bagDropCutoffMinutes} min before departure.`);
  }
  const arriveTitle = result.mode === "drive" ? "Parked at the airport" : "Arrive at the airport";
  const rows: Array<{ key: string; iso: string; title: string; seg?: (typeof segments)[number]; lead?: string; notes: string[]; hot?: boolean }> = [
    { key: "leave", iso: stops[0].iso, title: "Walk out the door", seg: segments[0], notes: driveNotes, hot: true },
    { key: "arrive", iso: stops[1].iso, title: arriveTitle, seg: segments[1], notes: [] },
    { key: "security", iso: stops[2].iso, title: "Security", seg: segments[2], lead: r.checkpoint, notes: securityNotes },
    { key: "gate", iso: stops[3].iso, title: "Walk to the gate", seg: segments[3], notes: r.gateNotes },
    { key: "spare", iso: stops[4].iso, title: "Spare time", seg: segments[4], notes: [] },
    { key: "boarding", iso: stops[5].iso, title: "Boarding starts", seg: segments[5], notes: [] },
    { key: "departure", iso: stops[6].iso, title: "Departure", notes: [] },
  ];

  const status = statusPill(live, f);
  const gate = live?.gate ?? f.gate;
  const terminal = live?.terminal ?? f.terminal;
  const isToday = request.date === localDateString(0);
  const pickupISO = new Date(new Date(plan.leaveISO).getTime() - 5 * 60_000).toISOString();

  const share = async () => {
    const text = shareText(result, leaveLabel, buffer, planUrl);
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // user cancelled
    }
  };

  const ready = isReady(values, null);
  const tone = late ? "coral" : soon ? "mustard" : "paper";

  return (
    <motion.div
      className="flex flex-1 flex-col gap-3 pb-8"
      variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.09, delayChildren: 0.05 } } }}
      initial="hidden"
      animate="show"
    >
      <motion.section
        variants={{ hidden: { opacity: 0, scale: 0.96, y: 10 }, show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 24 } } }}
        className={`relative overflow-hidden rounded-[28px] border border-line px-5 pb-6 pt-7 text-center shadow-card ${late ? "bg-coral-pale" : soon ? "bg-mustard-soft" : "bg-paper"}`}
      >
        <Geometry tone={tone} />
        <button
          type="button"
          aria-label={editing ? "Close editing" : "Change your inputs"}
          aria-expanded={editing}
          onClick={() => setEditing((e) => !e)}
          className="absolute right-3.5 top-3.5 z-10 grid h-10 w-10 place-items-center rounded-full border border-line bg-paper/90 text-ink shadow-card backdrop-blur"
        >
          {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
        </button>
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-2">{late ? "Leave now" : "Leave by"}</p>
          <div className="display-soft mt-2 flex items-baseline justify-center gap-2 font-display text-[92px] font-semibold leading-none tracking-[-0.03em]" aria-live="polite">
            <RollingNumber value={leave.hm} />
            <span className="font-sans text-[18px] font-semibold tracking-[0.06em] text-ink-2">{leave.ampm}</span>
          </div>
          <p className="mt-2 text-[14.5px] text-ink-2">
            {day.rel ? <b className="font-semibold text-ink">{day.rel}</b> : null}
            {day.rel ? " · " : null}
            {day.pretty}
            {foreignTz ? ` · ${tzAbbrev(plan.leaveISO, tz)}` : null}
          </p>
          <div className="mt-3">
            <Countdown toISO={plan.leaveISO} />
          </div>
          {sharedAt ? (
            <p className="mt-2.5 text-[12.5px] text-ink-2">
              Shared plan from {fmtTimeShort(sharedAt, tz)} ·{" "}
              <button type="button" onClick={onUpdate} className="font-semibold text-ink underline underline-offset-4">
                Refresh
              </button>
            </p>
          ) : null}
        </div>
      </motion.section>

      <AnimatePresence initial={false}>
        {editing ? (
          <motion.section
            key="edit"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="card flex flex-col gap-3 !p-3.5">
              <PlanFields values={values} onChange={onChange} profile={profile} notFound={null} compact />
              <p className="text-[12.5px] text-ink-3">The slider updates the time instantly. Anything else needs a fresh search.</p>
              <button
                type="button"
                className="btn-primary !min-h-[50px] !text-[15px]"
                disabled={!ready}
                onClick={() => {
                  setEditing(false);
                  onUpdate();
                }}
              >
                Update my time
              </button>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <motion.section variants={rise} className="card flex items-center gap-3.5">
        {logoOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={airlineLogoUrl(f.airlineCode)}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-[14px] border border-line bg-ground object-contain p-1"
            onError={() => setLogoOk(false)}
          />
        ) : (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-ink font-display text-[15px] font-semibold text-paper">{f.airlineCode}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <a href={flightStatusLink(result)} target="_blank" rel="noreferrer" className="font-display text-[19px] font-semibold underline decoration-line underline-offset-4">
              {f.flightNumber}
            </a>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.cls}`}>{status.label}</span>
          </div>
          <p className="truncate text-[13.5px] text-ink-2">
            <b className="font-semibold text-ink">{f.departureAirport}</b>
            {f.destinationAirportCode ? (
              <>
                {" → "}
                <b className="font-semibold text-ink">{f.destinationAirportCode}</b>
              </>
            ) : null}
            {" · departs "}
            <b className="font-semibold text-ink">{fmtTimeShort(live?.departureTime ?? f.departureTime, tz)}</b>
            {terminal ? ` · T${terminal}` : ""}
            {gate ? ` · Gate ${gate}` : ""}
          </p>
        </div>
      </motion.section>

      <motion.section variants={rise}>
        {result.mode === "ride" ? (
          <>
            <p className="mb-2 text-center text-[13px] text-ink-2">
              {isToday ? (
                <>
                  Book pickup for <b className="font-semibold text-ink">{fmtTimeShort(pickupISO, tz)}</b>
                </>
              ) : (
                <>
                  Tap <b className="font-semibold text-ink">Schedule</b> in the app and set pickup for{" "}
                  <b className="font-semibold text-ink">
                    {day.pretty}, {fmtTimeShort(pickupISO, tz)}
                  </b>
                </>
              )}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <a href={uberLink(result)} target="_blank" rel="noreferrer" className="btn-dark">
                <Car className="h-4 w-4" /> Uber
              </a>
              <a href={lyftLink(result)} target="_blank" rel="noreferrer" className="btn-dark">
                <Car className="h-4 w-4" /> Lyft
              </a>
            </div>
            <p className="mt-2 text-center text-[12.5px] text-ink-3">
              Drop-off <b className="font-semibold text-ink-2">{dropoffLabel(result)}</b>
              {dropoffCoord(result) || !f.terminal ? "" : " · confirm the terminal in the app"}
            </p>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <a href={googleMapsLink(result, result.mode === "transit" ? "transit" : "driving")} target="_blank" rel="noreferrer" className="btn-dark">
              {result.mode === "transit" ? <TrainFront className="h-4 w-4" /> : <Map className="h-4 w-4" />} Google Maps
            </a>
            <a href={appleMapsLink(result, result.mode === "transit" ? "transit" : "driving")} target="_blank" rel="noreferrer" className="btn-dark">
              {result.mode === "transit" ? <TrainFront className="h-4 w-4" /> : <Map className="h-4 w-4" />} Apple Maps
            </a>
          </div>
        )}
      </motion.section>

      <motion.section variants={rise} className="card">
        <div className="flex items-baseline justify-between">
          <h3 className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-3">The plan</h3>
          <span className="text-[12.5px] text-ink-2">
            Door to departure{" "}
            <b className="font-semibold tabular-nums text-ink">
              {Math.floor(total / 60)}h {total % 60}m
            </b>
          </span>
        </div>
        <div className="mt-3 flex h-2.5 gap-[3px] overflow-hidden rounded-full">
          {segments.map((s, i) => (
            <motion.span
              key={s.label}
              style={{ flex: Math.max(s.min, 1), background: s.color, transformOrigin: "left" }}
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 24, delay: 0.35 + i * 0.07 }}
              className="block rounded-full"
            />
          ))}
        </div>
        <ol className="mt-4 flex flex-col">
          {rows.map((row, i) => (
            <motion.li
              key={row.key}
              initial={reduce ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 26, delay: 0.45 + i * 0.06 }}
              className="grid grid-cols-[56px_16px_1fr] gap-x-3"
            >
              <time className="display-soft pt-0.5 font-display text-[17px] font-semibold leading-none">{fmtTimeShort(row.iso, tz).replace(/ (AM|PM)/, "")}</time>
              <span className="relative flex justify-center">
                <i
                  className="mt-1 block h-3 w-3 rounded-full"
                  style={{ background: row.seg ? row.seg.color : "var(--line)", boxShadow: row.hot ? "0 0 0 4px var(--coral-pale)" : undefined }}
                />
                {i < rows.length - 1 ? <i className="absolute bottom-0 top-5 w-px bg-line" /> : null}
              </span>
              <div className={`min-w-0 ${i < rows.length - 1 ? "pb-4" : ""}`}>
                <span className={`block text-[15px] ${row.hot ? "font-semibold" : "font-medium"} text-ink`}>{row.title}</span>
                {row.seg ? (
                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-ground px-2.5 py-0.5 text-[11.5px] font-medium text-ink-2">
                    <i className="h-1.5 w-1.5 rounded-full" style={{ background: row.seg.color }} />
                    {row.seg.label} · <span className="tabular-nums text-ink">{row.seg.min} min</span>
                  </span>
                ) : null}
                {row.lead ? <p className="mt-1.5 text-[13.5px] leading-snug text-ink">{row.lead}</p> : null}
                {row.notes.map((n) => (
                  <p key={n} className="mt-1 text-[13.5px] leading-snug text-ink-2">
                    {n}
                  </p>
                ))}
              </div>
            </motion.li>
          ))}
        </ol>
      </motion.section>

      {r.headsUp.length ? (
        <motion.p variants={rise} className="px-1 text-center text-[12.5px] text-ink-3">
          {r.headsUp.join(" ")}
        </motion.p>
      ) : null}

      <motion.div variants={rise} className="grid grid-cols-2 gap-2">
        <a href={reminderLink(result, plan.leaveISO, planUrl)} className="btn-secondary">
          <BellRing className="h-4 w-4" /> Set reminder
        </a>
        <button type="button" onClick={share} className="btn-secondary">
          <Share2 className="h-4 w-4" /> {copied ? "Copied" : "Share"}
        </button>
      </motion.div>

      <motion.button variants={rise} type="button" onClick={onReset} className="mx-auto mt-1 flex items-center gap-1.5 text-[14px] font-medium text-ink-2">
        <RotateCcw className="h-4 w-4" /> Start over
      </motion.button>
    </motion.div>
  );
}

function statusPill(live: LiveStatus | null, f: PlanResult["flight"]): { label: string; cls: string } {
  const status = live?.status ?? f.status;
  const delay = live?.delayMinutes ?? f.delayMinutes;
  const dep = new Date(live?.departureTime ?? f.departureTime).getTime();
  if (status === "cancelled") return { label: "Cancelled", cls: "bg-coral text-paper" };
  if (Date.now() > dep + 10 * 60_000) return { label: "Departed", cls: "bg-ground text-ink-2" };
  if (delay > 0 || status === "delayed") return { label: delay > 0 ? `Delayed ${delay} min` : "Delayed", cls: "bg-mustard-soft text-ink" };
  if (status === "unknown") return { label: "Scheduled", cls: "bg-ground text-ink-2" };
  return { label: "On time", cls: "bg-sage-soft text-ink" };
}
