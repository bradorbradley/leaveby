"use client";

import { motion } from "framer-motion";
import { CalendarPlus, Car, ChevronDown, Map, Pencil, RotateCcw, Share2, TrainFront } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { GateSlider } from "@/components/GateSlider";
import { deviceTz, fmtDay, fmtTime, fmtTimeShort, minutesBetween, prettyDate, tzAbbrev } from "@/lib/format";
import { computePlan } from "@/lib/plan-math";
import { airlineLogoUrl, appleMapsLink, calendarLink, flightStatusLink, googleMapsLink, lyftLink, planQuery, shareText, uberLink } from "@/lib/ride-links";
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
  onEdit,
  onReset,
  onBuffer,
}: {
  result: PlanResult;
  request: PlanRequest;
  onEdit: () => void;
  onReset: () => void;
  onBuffer: (v: number) => void;
}) {
  const [buffer, setBuffer] = useState(result.bufferMinutes);
  const [copied, setCopied] = useState(false);
  const [live, setLive] = useState<LiveStatus | null>(null);
  const [logoOk, setLogoOk] = useState(true);
  const [planUrl, setPlanUrl] = useState("");

  const f = result.flight;
  const tz = f.departureTimezone ?? "America/New_York";
  const r = result.research;
  const live_ = useMemo(
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

  const leave = fmtTime(live_.leaveISO, tz);
  const day = fmtDay(live_.leaveISO, tz);
  const foreignTz = deviceTz() && deviceTz() !== tz;
  const minutesUntil = minutesBetween(new Date().toISOString(), live_.leaveISO);
  const late = live_.isLate;
  const soon = !late && minutesUntil <= 20;
  const leaveLabel = `${leave.hm} ${leave.ampm}${day.rel === "Today" ? "" : ` ${day.rel ?? day.pretty}`}`;

  const stops = live_.timeline;
  const seg = (a: number, b: number) => minutesBetween(stops[a].iso, stops[b].iso);
  const travelLabel = result.mode === "transit" ? "Transit" : result.mode === "drive" ? "Drive + park" : "Drive";
  const segments = [
    { label: travelLabel, min: seg(0, 1), color: "var(--lilac-deep)" },
    { label: "Curb through security", min: seg(1, 2), color: "var(--blush-deep)" },
    { label: "Security to gate", min: seg(2, 3), color: "var(--butter-deep)" },
    { label: "Time to spare", min: seg(3, 4), color: "var(--sage-deep)" },
    { label: "Boarding to doors", min: seg(4, 5), color: "var(--ink-3)" },
  ];
  const total = segments.reduce((s, x) => s + x.min, 0);

  const securityNotes = [`${r.lane} · ${r.checkpoint}`, ...r.securityNotes];
  if (result.checkedBag && r.bagDropCutoffMinutes && !r.securityNotes.some((n) => /bag/i.test(n))) {
    securityNotes.push(`Bag drop closes ${r.bagDropCutoffMinutes} min before departure.`);
  }
  const rows: Array<{ stop: (typeof stops)[number]; seg?: (typeof segments)[number]; notes: string[]; hot?: boolean }> = [
    { stop: stops[0], seg: segments[0], notes: r.driveNotes, hot: true },
    { stop: stops[1], seg: segments[1], notes: securityNotes },
    { stop: stops[2], seg: segments[2], notes: r.gateNotes },
    { stop: stops[3], seg: segments[3], notes: [] },
    { stop: stops[4], seg: segments[4], notes: [] },
    { stop: stops[5], notes: [] },
  ];

  const status = statusPill(live, f, tz);
  const gate = live?.gate ?? f.gate;
  const terminal = live?.terminal ?? f.terminal;

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

  const inputChips = [
    day.rel ? `${day.rel}, ${prettyDate(request.date)}` : prettyDate(request.date),
    request.origin?.label ? `From ${request.origin.label.split(",")[0]}` : "No starting point",
    result.mode === "transit" ? "Transit" : result.mode === "drive" ? "Driving" : "Ride",
    result.checkedBag ? "Checked bag" : "Carry-on",
    [request.perks.precheck && "PreCheck", request.perks.clear && "CLEAR", request.perks.globalEntry && "Global Entry", request.perks.touchlessId && "Touchless ID"]
      .filter(Boolean)
      .join(" · ") || "No skip-the-line",
  ];

  const pickupISO = new Date(new Date(live_.leaveISO).getTime() - 5 * 60_000).toISOString();

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
            key={live_.leaveISO}
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
            {foreignTz ? ` · ${tzAbbrev(live_.leaveISO, tz)}` : null}
          </p>
          {late ? <p className="mt-2 text-[14px] font-semibold text-ink">You&apos;re {Math.abs(minutesUntil)} min behind. Go.</p> : null}
        </div>
      </motion.section>

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

      <section className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {inputChips.map((c) => (
            <span key={c} className="shrink-0 rounded-full border-[1.5px] border-line bg-paper px-2.5 py-1 text-[12px] font-semibold text-ink-2">
              {c}
            </span>
          ))}
        </div>
        <button type="button" onClick={onEdit} className="btn-secondary !min-h-[34px] shrink-0 !rounded-full !px-3 !text-[12.5px]">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </section>

      <section>
        {result.mode === "ride" ? (
          <>
            <p className="mb-1.5 text-center text-[12.5px] text-ink-2">
              Book pickup for <b className="text-ink">{fmtTimeShort(pickupISO, tz)}</b>
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

      <GateSlider
        value={buffer}
        compact
        onChange={(v) => {
          setBuffer(v);
          onBuffer(v);
        }}
      />

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
            <li key={row.stop.key} className="grid grid-cols-[58px_14px_1fr] gap-x-2.5">
              <time className="pt-0.5 text-[13px] font-bold tabular-nums">{fmtTimeShort(row.stop.iso, tz).replace(/ (AM|PM)/, "")}</time>
              <span className="relative flex justify-center">
                <i className="mt-1 block h-2.5 w-2.5 rounded-full" style={{ background: row.seg ? row.seg.color : "var(--line)", boxShadow: row.hot ? "0 0 0 4px var(--lilac)" : undefined }} />
                {i < rows.length - 1 ? <i className="absolute bottom-0 top-4 w-0.5 bg-line" /> : null}
              </span>
              <div className={`min-w-0 ${i < rows.length - 1 ? "pb-3.5" : ""}`}>
                <span className={`block text-[14px] ${row.hot ? "font-bold text-ink" : "font-semibold text-ink"}`}>{row.stop.label}</span>
                {row.seg ? (
                  <span className="mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold text-ink-2" style={{ background: "var(--ground)" }}>
                    <i className="h-1.5 w-1.5 rounded-full" style={{ background: row.seg.color }} />
                    {row.seg.label} · <span className="tabular-nums text-ink">{row.seg.min} min</span>
                  </span>
                ) : null}
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

      {r.headsUp.length ? (
        <section className="rounded-[20px] bg-butter p-4">
          <h3 className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-2">⚠️ Heads up</h3>
          <ul className="mt-1 flex flex-col gap-1.5 text-[14px] text-ink">
            {r.headsUp.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <a href={calendarLink(result, live_.leaveISO, planUrl)} target="_blank" rel="noreferrer" className="btn-secondary">
          <CalendarPlus className="h-4 w-4" /> Add to calendar
        </a>
        <button type="button" onClick={share} className="btn-secondary">
          <Share2 className="h-4 w-4" /> {copied ? "Copied" : "Share"}
        </button>
      </div>

      <details className="group px-1">
        <summary className="flex cursor-pointer list-none items-center justify-center gap-1 text-center text-[12px] font-semibold text-ink-3">
          Where this came from <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
        </summary>
        <ul className="mt-2 flex flex-col gap-1 text-[12px] text-ink-3">
          {r.sources.map((s) => (
            <li key={s} className="break-words">
              {s}
            </li>
          ))}
          <li>
            Searched live with {r.engine}. Flight data: {f.source}. Route: {result.route.source}.
          </li>
        </ul>
      </details>

      <button type="button" onClick={onReset} className="mx-auto mt-1 flex items-center gap-1.5 text-[14px] font-semibold text-ink-2">
        <RotateCcw className="h-4 w-4" /> Start over
      </button>
    </div>
  );
}

function statusPill(live: LiveStatus | null, f: PlanResult["flight"], tz: string): { label: string; cls: string } {
  const status = live?.status ?? f.status;
  const delay = live?.delayMinutes ?? f.delayMinutes;
  const dep = new Date(live?.departureTime ?? f.departureTime).getTime();
  void tz;
  if (status === "cancelled") return { label: "Cancelled", cls: "bg-blush text-ink" };
  if (Date.now() > dep + 10 * 60_000) return { label: "Departed", cls: "bg-line text-ink-2" };
  if (delay > 0 || status === "delayed") return { label: delay > 0 ? `Delayed ${delay} min` : "Delayed", cls: "bg-butter text-ink" };
  if (status === "unknown") return { label: "Scheduled", cls: "bg-line text-ink-2" };
  return { label: "On time", cls: "bg-sage text-ink" };
}
