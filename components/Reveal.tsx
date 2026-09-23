"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BellRing, Car, Map, Pencil, RotateCcw, Share2, TrainFront, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PlanFields, isReady, type FormValues } from "@/components/PlanForm";
import { deviceTz, fmtDay, fmtTime, fmtTimeShort, localDateString, minutesBetween, tzAbbrev } from "@/lib/format";
import { computePlan } from "@/lib/plan-math";
import type { Profile } from "@/lib/profile";
import { airlineLogoUrl, appleMapsLink, flightStatusLink, googleMapsLink, lyftLink, planQuery, reminderLink, shareText, uberLink } from "@/lib/ride-links";
import type { PlanRequest, PlanResult } from "@/types/plan";

interface LiveStatus {
  status: "scheduled" | "delayed" | "cancelled" | "unknown";
  delayMinutes: number;
  gate: string | null;
  terminal: string | null;
  departureTime: string;
}

export function Reveal({
  result,
  request,
  values,
  onChange,
  onUpdate,
  profile,
  onReset,
}: {
  result: PlanResult;
  request: PlanRequest;
  values: FormValues;
  onChange: (patch: Partial<FormValues>) => void;
  onUpdate: () => void;
  profile: Profile;
  onReset: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [live, setLive] = useState<LiveStatus | null>(null);
  const [logoOk, setLogoOk] = useState(true);
  const [planUrl, setPlanUrl] = useState("");

  const f = result.flight;
  const tz = f.departureTimezone ?? "America/New_York";
  const r = result.research;
  const buffer = values.bufferMinutes;
  const plan = useMemo(
    () => computePlan({ flight: f, route: result.route, research: r, bufferMinutes: buffer, checkedBag: result.checkedBag, mode: result.mode }),
    [f, result.route, result.checkedBag, result.mode, r, buffer],
  );

  useEffect(() => {
    try {
      setPlanUrl(`${window.location.origin}/?${planQuery({ ...request, bufferMinutes: buffer })}`);
    } catch {
      setPlanUrl("");
    }
  }, [request, buffer]);

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
  const minutesUntil = minutesBetween(new Date().toISOString(), plan.leaveISO);
  const late = plan.isLate;
  const soon = !late && minutesUntil <= 20;
  const leaveLabel = `${leave.hm} ${leave.ampm}${day.rel === "Today" ? "" : ` ${day.rel ?? day.pretty}`}`;

  const stops = plan.timeline;
  const seg = (a: number, b: number) => minutesBetween(stops[a].iso, stops[b].iso);
  const travelLabel = result.mode === "transit" ? "Transit" : result.mode === "drive" ? "Drive + park" : "Drive";
  const segments = [
    { label: travelLabel, min: seg(0, 1), color: "var(--lilac-deep)" },
    { label: "Curb through security", min: seg(1, 2), color: "var(--blush-deep)" },
    { label: "Walk to the gate", min: seg(2, 3), color: "var(--butter-deep)" },
    { label: "Time to spare", min: seg(3, 4), color: "var(--sage-deep)" },
    { label: "Boarding to doors", min: seg(4, 5), color: "var(--ink-3)" },
  ];
  const total = segments.reduce((s, x) => s + x.min, 0);

  const driveNotes = r.driveNotes;
  const securityNotes = [...r.securityNotes];
  if (result.checkedBag && r.bagDropCutoffMinutes && !r.securityNotes.some((n) => /bag/i.test(n))) {
    securityNotes.push(`Bag drop closes ${r.bagDropCutoffMinutes} min before departure.`);
  }
  const rows: Array<{ key: string; iso: string; title: string; seg?: (typeof segments)[number]; lead?: string; notes: string[]; hot?: boolean }> = [
    { key: "leave", iso: stops[0].iso, title: "Walk out the door", seg: segments[0], notes: driveNotes, hot: true },
    { key: "security", iso: stops[1].iso, title: "Security", seg: segments[1], lead: r.checkpoint, notes: securityNotes },
    { key: "gate", iso: stops[2].iso, title: "Walk to the gate", seg: segments[2], notes: r.gateNotes },
    { key: "wait", iso: stops[3].iso, title: "At the gate", seg: segments[3], notes: [] },
    { key: "boarding", iso: stops[4].iso, title: "Boarding starts", seg: segments[4], notes: [] },
    { key: "departure", iso: stops[5].iso, title: "Departure", notes: [] },
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

  return (
    <div className="flex flex-1 flex-col gap-3 pb-8">
      <motion.section
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={`relative overflow-hidden rounded-[28px] px-5 pb-5 pt-6 text-center ${late ? "bg-blush" : soon ? "bg-butter" : "bg-lilac"}`}
      >
        <span aria-hidden="true" className={`absolute -left-10 -top-12 h-32 w-32 rounded-full ${late ? "bg-butter/70" : "bg-blush/70"}`} />
        <span aria-hidden="true" className={`absolute -bottom-10 -right-6 h-24 w-24 rounded-full ${late ? "bg-lilac/70" : "bg-butter/80"}`} />
        <span aria-hidden="true" className="absolute bottom-5 left-5 animate-twinkle text-lg [animation-delay:0.8s]">✦</span>
        <button
          type="button"
          aria-label={editing ? "Close editing" : "Change your inputs"}
          aria-expanded={editing}
          onClick={() => setEditing((e) => !e)}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-paper/80 text-ink shadow-sm backdrop-blur"
        >
          {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
        </button>
        <div className="relative">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-ink-2">{late ? "Leave now" : "Leave by"}</p>
          <motion.div
            key={plan.leaveISO}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="mt-1 flex items-baseline justify-center gap-1.5 font-display text-[76px] font-black leading-none tracking-[-0.04em] tabular-nums"
            aria-live="polite"
          >
            {leave.hm}
            <span className="text-[24px] font-bold tracking-normal">{leave.ampm}</span>
          </motion.div>
          <p className="mt-1 text-[14px] text-ink-2">
            {day.rel ? <b className="text-ink">{day.rel}</b> : null}
            {day.rel ? " · " : null}
            {day.pretty}
            {foreignTz ? ` · ${tzAbbrev(plan.leaveISO, tz)}` : null}
          </p>
          {late ? <p className="mt-2 text-[14px] font-semibold text-ink">You&apos;re {Math.abs(minutesUntil)} min behind. Go.</p> : null}
        </div>
      </motion.section>

      <AnimatePresence initial={false}>
        {editing ? (
          <motion.section
            key="edit"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="card flex flex-col gap-3 !p-3.5">
              <PlanFields values={values} onChange={onChange} profile={profile} notFound={null} compact />
              <p className="text-[12px] text-ink-3">The gate slider updates the time instantly. Anything else needs a fresh search.</p>
              <button
                type="button"
                className="btn-primary !min-h-[48px] !text-[15px]"
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

      <section className="card flex items-center gap-3">
        {logoOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={airlineLogoUrl(f.airlineCode)}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-xl bg-ground object-contain"
            onError={() => setLogoOk(false)}
          />
        ) : (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lilac font-display text-[13px] font-black">{f.airlineCode}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <a href={flightStatusLink(result)} target="_blank" rel="noreferrer" className="text-[16px] font-bold underline decoration-line underline-offset-4">
              {f.flightNumber}
            </a>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${status.cls}`}>{status.label}</span>
          </div>
          <p className="truncate text-[13px] text-ink-2">
            <b className="text-ink">{f.departureAirport}</b>
            {f.destinationAirportCode ? (
              <>
                {" → "}
                <b className="text-ink">{f.destinationAirportCode}</b>
              </>
            ) : null}
            {" · departs "}
            <b className="text-ink">{fmtTimeShort(live?.departureTime ?? f.departureTime, tz)}</b>
            {terminal ? ` · T${terminal}` : ""}
            {gate ? ` · Gate ${gate}` : ""}
          </p>
        </div>
      </section>

      <section>
        {result.mode === "ride" ? (
          <>
            <p className="mb-1.5 text-center text-[12.5px] text-ink-2">
              {isToday ? (
                <>
                  Book pickup for <b className="text-ink">{fmtTimeShort(pickupISO, tz)}</b>
                </>
              ) : (
                <>
                  Tap <b className="text-ink">Schedule</b> in the app and set pickup for <b className="text-ink">{day.pretty}, {fmtTimeShort(pickupISO, tz)}</b>
                </>
              )}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <a href={uberLink(result)} target="_blank" rel="noreferrer" className="btn-secondary !bg-ink !text-ground">
                <Car className="h-4 w-4" /> Uber
              </a>
              <a href={lyftLink(result)} target="_blank" rel="noreferrer" className="btn-secondary !bg-ink !text-ground">
                <Car className="h-4 w-4" /> Lyft
              </a>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <a href={googleMapsLink(result, result.mode === "transit" ? "transit" : "driving")} target="_blank" rel="noreferrer" className="btn-secondary !bg-ink !text-ground">
              {result.mode === "transit" ? <TrainFront className="h-4 w-4" /> : <Map className="h-4 w-4" />} Google Maps
            </a>
            <a href={appleMapsLink(result, result.mode === "transit" ? "transit" : "driving")} target="_blank" rel="noreferrer" className="btn-secondary !bg-ink !text-ground">
              {result.mode === "transit" ? <TrainFront className="h-4 w-4" /> : <Map className="h-4 w-4" />} Apple Maps
            </a>
          </div>
        )}
      </section>

      <section className="card">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-3">The plan</h3>
          <span className="text-[12.5px] text-ink-2">
            Door to departure <b className="tabular-nums text-ink">{Math.floor(total / 60)}h {total % 60}m</b>
          </span>
        </div>
        <div className="mt-2 flex h-3 gap-0.5 overflow-hidden rounded-full">
          {segments.map((s) => (
            <span key={s.label} style={{ flex: Math.max(s.min, 1), background: s.color }} className="block transition-[flex] duration-300" />
          ))}
        </div>
        <ol className="mt-3 flex flex-col">
          {rows.map((row, i) => (
            <li key={row.key} className="grid grid-cols-[58px_14px_1fr] gap-x-2.5">
              <time className="pt-0.5 text-[13px] font-bold tabular-nums">{fmtTimeShort(row.iso, tz).replace(/ (AM|PM)/, "")}</time>
              <span className="relative flex justify-center">
                <i className="mt-1 block h-2.5 w-2.5 rounded-full" style={{ background: row.seg ? row.seg.color : "var(--line)", boxShadow: row.hot ? "0 0 0 4px var(--lilac)" : undefined }} />
                {i < rows.length - 1 ? <i className="absolute bottom-0 top-4 w-0.5 bg-line" /> : null}
              </span>
              <div className={`min-w-0 ${i < rows.length - 1 ? "pb-3.5" : ""}`}>
                <span className={`block text-[14px] ${row.hot ? "font-bold text-ink" : "font-semibold text-ink"}`}>{row.title}</span>
                {row.seg ? (
                  <span className="mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold text-ink-2" style={{ background: "var(--ground)" }}>
                    <i className="h-1.5 w-1.5 rounded-full" style={{ background: row.seg.color }} />
                    {row.seg.label} · <span className="tabular-nums text-ink">{row.seg.min} min</span>
                  </span>
                ) : null}
                {row.lead ? <p className="mt-1 text-[13px] leading-snug text-ink">{row.lead}</p> : null}
                {row.notes.map((n) => (
                  <p key={n} className="mt-1 text-[13px] leading-snug text-ink-2">
                    {n}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {r.headsUp.length ? <p className="px-1 text-center text-[12px] text-ink-3">{r.headsUp.join(" ")}</p> : null}

      <div className="grid grid-cols-2 gap-2">
        <a href={reminderLink(result, plan.leaveISO, planUrl)} className="btn-secondary">
          <BellRing className="h-4 w-4" /> Set reminder
        </a>
        <button type="button" onClick={share} className="btn-secondary">
          <Share2 className="h-4 w-4" /> {copied ? "Copied" : "Share"}
        </button>
      </div>

      <button type="button" onClick={onReset} className="mx-auto mt-1 flex items-center gap-1.5 text-[14px] font-semibold text-ink-2">
        <RotateCcw className="h-4 w-4" /> Start over
      </button>
    </div>
  );
}

function statusPill(live: LiveStatus | null, f: PlanResult["flight"]): { label: string; cls: string } {
  const status = live?.status ?? f.status;
  const delay = live?.delayMinutes ?? f.delayMinutes;
  const dep = new Date(live?.departureTime ?? f.departureTime).getTime();
  if (status === "cancelled") return { label: "Cancelled", cls: "bg-blush text-ink" };
  if (Date.now() > dep + 10 * 60_000) return { label: "Departed", cls: "bg-line text-ink-2" };
  if (delay > 0 || status === "delayed") return { label: delay > 0 ? `Delayed ${delay} min` : "Delayed", cls: "bg-butter text-ink" };
  if (status === "unknown") return { label: "Scheduled", cls: "bg-line text-ink-2" };
  return { label: "On time", cls: "bg-sage text-ink" };
}
