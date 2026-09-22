"use client";

import { motion } from "framer-motion";
import { CalendarPlus, Car, ChevronDown, Map, RotateCcw, Share2 } from "lucide-react";
import { useMemo, useState } from "react";

import { GateSlider } from "@/components/GateSlider";
import { deviceTz, fmtDay, fmtTime, fmtTimeShort, minutesBetween, tzAbbrev } from "@/lib/format";
import { computePlan } from "@/lib/plan-math";
import { calendarLink, lyftLink, mapsLink, shareText, uberLink } from "@/lib/ride-links";
import type { PlanResult } from "@/types/plan";

export function Reveal({ result, onReset, onBuffer }: { result: PlanResult; onReset: () => void; onBuffer: (v: number) => void }) {
  const [buffer, setBuffer] = useState(result.bufferMinutes);
  const [copied, setCopied] = useState(false);
  const checkedBag = result.bagLeaveISO !== null;
  const live = useMemo(
    () => computePlan({ flight: result.flight, route: result.route, research: result.research, bufferMinutes: buffer, checkedBag }),
    [result, buffer, checkedBag],
  );
  const f = result.flight;
  const tz = f.departureTimezone ?? "America/New_York";
  const leave = fmtTime(live.leaveISO, tz);
  const day = fmtDay(live.leaveISO, tz);
  const foreignTz = deviceTz() && deviceTz() !== tz;
  const minutesUntil = minutesBetween(new Date().toISOString(), live.leaveISO);
  const late = live.isLate;
  const soon = !late && minutesUntil <= 20;
  const leaveLabel = `${leave.hm} ${leave.ampm}${day.rel === "Today" ? "" : ` ${day.rel ?? day.pretty}`}`;

  const stops = live.timeline;
  const seg = (a: number, b: number) => minutesBetween(stops[a].iso, stops[b].iso);
  const segments = [
    { label: "Drive", min: seg(0, 1), color: "var(--lilac-deep)" },
    { label: checkedBag ? "Bag drop + security" : "Curb to security", min: seg(1, 2), color: "var(--blush-deep)" },
    { label: "To the gate", min: seg(2, 3), color: "var(--butter-deep)" },
    { label: "At the gate", min: seg(3, 4), color: "var(--sage-deep)" },
    { label: "Boarding", min: seg(4, 5), color: "var(--ink-3)" },
  ];
  const total = segments.reduce((s, x) => s + x.min, 0);
  const tips = [result.research.gate, ...result.research.tips].filter((t): t is string => Boolean(t));

  const share = async () => {
    const text = shareText(result, leaveLabel);
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
        <span aria-hidden="true" className="absolute right-6 top-4 animate-twinkle text-lg">✦</span>
        <span aria-hidden="true" className="absolute bottom-5 left-5 animate-twinkle text-lg [animation-delay:0.8s]">✦</span>
        <div className="relative">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-ink-2">{late ? "Leave now" : "Leave by"}</p>
          <motion.div
            key={live.leaveISO}
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
            {foreignTz ? ` · ${tzAbbrev(live.leaveISO, tz)}` : null}
          </p>
          {late ? (
            <p className="mt-2 text-[14px] font-semibold text-ink">You&apos;re {Math.abs(minutesUntil)} min behind. Go.</p>
          ) : null}
          <p className="mt-3 text-[13.5px] text-ink-2">
            <b className="text-ink">{f.flightNumber}</b> · {f.departureAirport}
            {f.terminal ? ` Terminal ${f.terminal}` : ""} · departs <b className="text-ink">{fmtTimeShort(f.departureTime, tz)}</b>
          </p>
        </div>
      </motion.section>

      <div className="grid grid-cols-3 gap-2">
        <a href={uberLink(result)} target="_blank" rel="noreferrer" className="btn-secondary !bg-ink !text-ground">
          <Car className="h-4 w-4" /> Uber
        </a>
        <a href={lyftLink(result)} target="_blank" rel="noreferrer" className="btn-secondary !bg-ink !text-ground">
          <Car className="h-4 w-4" /> Lyft
        </a>
        <a href={mapsLink(result)} target="_blank" rel="noreferrer" className="btn-secondary">
          <Map className="h-4 w-4" /> Maps
        </a>
      </div>

      <GateSlider
        value={buffer}
        compact
        onChange={(v) => {
          setBuffer(v);
          onBuffer(v);
        }}
      />

      <section className="card">
        <h3 className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-3">Why {leave.hm}</h3>
        <div className="mt-2 flex h-3.5 gap-0.5 overflow-hidden rounded-full">
          {segments.map((s) => (
            <span key={s.label} style={{ flex: Math.max(s.min, 1), background: s.color }} className="block transition-[flex] duration-300" />
          ))}
        </div>
        <ul className="mt-2 flex flex-col gap-0.5 text-[13px] text-ink-2">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <i className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
              <b className="tabular-nums text-ink">{s.min} min</b>
            </li>
          ))}
          <li className="mt-1 flex items-center justify-between border-t border-line pt-1.5 text-[12.5px]">
            <span>Door to departure</span>
            <b className="tabular-nums text-ink">
              {Math.floor(total / 60)}h {total % 60}m
            </b>
          </li>
        </ul>
        <ol className="mt-3 flex flex-col">
          {stops.map((s, i) => (
            <li key={s.key} className="grid grid-cols-[64px_14px_1fr] items-center gap-2.5 py-1 text-[13.5px]">
              <time className="text-[13px] font-bold tabular-nums">{fmtTimeShort(s.iso, tz).replace(/ (AM|PM)/, "")}</time>
              <span className="relative justify-self-center">
                <i className={`block h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-lilac-deep ring-4 ring-lilac" : "bg-line"}`} />
                {i < stops.length - 1 ? <i className="absolute left-1 top-3 block h-5 w-0.5 bg-line" /> : null}
              </span>
              <span className={i === 0 ? "font-semibold text-ink" : "text-ink-2"}>{s.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h3 className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-3">🚗 Traffic</h3>
        <p className="mt-1 text-[14px] text-ink-2">{result.research.traffic}</p>
      </section>
      <section className="card">
        <h3 className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-3">🛂 Security</h3>
        <p className="mt-1 text-[14px] font-semibold text-ink">
          {result.research.lane} · {result.research.checkpoint}
        </p>
        <p className="mt-0.5 text-[14px] text-ink-2">{result.research.security}</p>
      </section>
      {result.research.headsUp.length ? (
        <section className="rounded-[20px] bg-butter p-4">
          <h3 className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-2">⚠️ Heads up</h3>
          <ul className="mt-1 flex flex-col gap-1.5 text-[14px] text-ink">
            {result.research.headsUp.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {tips.length ? (
        <details className="card group">
          <summary className="flex cursor-pointer list-none items-center justify-between text-[13.5px] font-bold">
            Insider tips
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </summary>
          <ul className="mt-2 flex flex-col gap-1.5 text-[14px] text-ink-2">
            {tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <a href={calendarLink(result, live.leaveISO)} target="_blank" rel="noreferrer" className="btn-secondary">
          <CalendarPlus className="h-4 w-4" /> Add to calendar
        </a>
        <button type="button" onClick={share} className="btn-secondary">
          <Share2 className="h-4 w-4" /> {copied ? "Copied" : "Share"}
        </button>
      </div>

      <details className="px-1">
        <summary className="cursor-pointer list-none text-center text-[12px] font-semibold text-ink-3">Where this came from</summary>
        <ul className="mt-2 flex flex-col gap-1 text-[12px] text-ink-3">
          {result.research.sources.map((s) => (
            <li key={s} className="break-words">
              {s.replace(/\s*\(\[[^\]]*\]\([^)]*\)\)/g, "")}
            </li>
          ))}
          <li>
            Searched live with {result.research.engine}. Flight data: {f.source}. Route: {result.route.source}.
          </li>
        </ul>
      </details>

      <button type="button" onClick={onReset} className="mx-auto mt-1 flex items-center gap-1.5 text-[14px] font-semibold text-ink-2">
        <RotateCcw className="h-4 w-4" /> Start over
      </button>
    </div>
  );
}
