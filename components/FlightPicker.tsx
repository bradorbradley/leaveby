"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { prettyDate } from "@/lib/format";
import { parseFlightNumber } from "@/lib/flight-utils";
import { track } from "@/lib/track";
import type { FlightOption, FlightOptions } from "@/types/flight";
import type { LegChoice, ManualFlight } from "@/types/plan";

/** "20:16" → { hm: "8:16", ampm: "PM" } */
function clock(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return { hm: `${h % 12 || 12}:${String(m).padStart(2, "0")}`, ampm: h < 12 ? "AM" : "PM" };
}

/** The flight and date a picked departure belongs to; a pick for another flight or day doesn't count. */
export function legKey(flightNumber: string, date: string) {
  const parsed = parseFlightNumber(flightNumber);
  return parsed && /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${parsed.normalized}|${date}` : "";
}

type Lookup = { key: string; state: "loading" } | { key: string; state: "done"; result: FlightOptions } | { key: string; state: "failed" };

// Answers survive re-renders and the reveal's edit panel, so going back is instant.
const answers = new Map<string, FlightOptions>();

/**
 * As soon as a flight number and date are in, list every departure that flight makes that
 * day so the traveler picks theirs. We never pick for them when there's more than one.
 */
export function FlightPicker({
  flightNumber,
  date,
  leg,
  legFor,
  manual,
  manualOpen,
  onPick,
  onManual,
  compact = false,
}: {
  flightNumber: string;
  date: string;
  leg: LegChoice | null;
  legFor: string;
  manual: ManualFlight;
  manualOpen: boolean;
  onPick: (leg: LegChoice | null, key: string) => void;
  onManual: (patch: { manual?: ManualFlight; manualOpen?: boolean }) => void;
  compact?: boolean;
}) {
  const key = legKey(flightNumber, date);
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [attempt, setAttempt] = useState(0);
  const picked = leg && legFor === key ? leg : null;
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const pickedRef = useRef(picked);
  pickedRef.current = picked;

  useEffect(() => {
    if (!key) {
      setLookup(null);
      return;
    }
    const known = answers.get(key);
    if (known) {
      setLookup({ key, state: "done", result: known });
      return;
    }
    setLookup({ key, state: "loading" });
    const controller = new AbortController();
    const [flight, day] = key.split("|");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/flight/options?flight=${encodeURIComponent(flight)}&date=${day}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        const result = (await res.json()) as FlightOptions;
        if (result.status !== "unavailable") answers.set(key, result);
        setLookup({ key, state: "done", result });
        track("flight_options", { status: result.status, count: result.options.length });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setLookup({ key, state: "failed" });
        track("flight_options", { status: "failed", count: 0 });
      }
    }, 280);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [key, attempt]);

  const result = lookup?.key === key && lookup.state === "done" ? lookup.result : null;
  const loading = Boolean(key) && (!lookup || lookup.key !== key || lookup.state === "loading");
  const failed = lookup?.key === key && lookup.state === "failed";
  const open = result?.options.filter((o) => !o.departed && !o.cancelled) ?? [];

  // Exactly one departure that day, still to come: that's the flight. Anything else waits for a tap.
  useEffect(() => {
    if (!result || result.status !== "exact" || pickedRef.current) return;
    if (result.options.length === 1 && open.length === 1) {
      const o = open[0];
      onPickRef.current({ airport: o.airport, time: o.time, destination: o.destination, confirmed: "schedule" }, key);
    }
  }, [result, key, open]);

  // Nothing to pick from: go straight to typing the airport and time.
  const noOptions = failed || (result && result.options.length === 0);
  useEffect(() => {
    if (noOptions && !manualOpen) onManual({ manualOpen: true });
  }, [noOptions, manualOpen, onManual]);

  if (!key) return null;

  const pick = (o: FlightOption) => {
    onManual({ manualOpen: false });
    onPickRef.current({ airport: o.airport, time: o.time, destination: o.destination, confirmed: "schedule" }, key);
    track("flight_picked", { exact: o.exact, choices: result?.options.length ?? 0 });
  };

  const heading = (() => {
    if (failed) return "We couldn't reach flight schedules just now. Enter your airport and departure time, or try again.";
    if (!result) return null;
    const day = prettyDate(result.date);
    switch (result.status) {
      case "exact":
        return result.options.length > 1 ? `${result.flightNumber} flies ${result.options.length} legs on ${day}. Which one are you on?` : `${result.flightNumber} on ${day}`;
      case "typical":
        return `${day}'s schedule isn't out yet. Pick your route, then check the time on your ticket.`;
      case "not_operating":
        return `We don't see ${result.flightNumber} flying on ${day}. Check the date, or enter your airport and departure time.`;
      case "not_found":
        return `We couldn't find ${result.flightNumber}. Check the number, or enter your airport and departure time.`;
      case "unavailable":
        return `We couldn't reach flight schedules just now. Enter your airport and departure time, or try again.`;
    }
  })();

  return (
    <div className={compact ? "mt-2" : "mt-3"} aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5 rounded-[18px] border border-dashed border-line px-4 py-3.5 text-[14px] text-ink-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-coral" />
            Looking up {parseFlightNumber(flightNumber)?.normalized}…
          </motion.div>
        ) : (
          <motion.div key={`done-${key}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
            {heading ? <p className="px-1 text-[13.5px] font-medium leading-snug text-ink-2">{heading}</p> : null}

            {!manualOpen && result?.options.length ? (
              <div role="radiogroup" aria-label="Your departure" className="flex flex-col gap-2">
                {result.options.map((o) => {
                  const selected = Boolean(picked && picked.confirmed === "schedule" && picked.airport === o.airport && (o.exact ? picked.time === o.time : true) && (picked.destination ?? null) === (o.destination ?? null));
                  const disabled = o.departed || o.cancelled;
                  const t = clock(o.time);
                  return (
                    <motion.button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={disabled}
                      whileTap={disabled ? undefined : { scale: 0.985 }}
                      onClick={() => pick(o)}
                      className={`flex w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition-colors duration-200 ${
                        selected ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink"
                      } ${disabled ? "opacity-45" : ""}`}
                      style={selected ? { backgroundImage: "linear-gradient(180deg, #2e2f44 0%, var(--ink) 60%)" } : { boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 8px 16px -12px rgba(31,32,48,0.3)" }}
                    >
                      <span className="w-[74px] shrink-0">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] opacity-60">{o.exact ? "Departs" : "Usually"}</span>
                        <span className="font-display text-[20px] font-semibold leading-tight">
                          {t.hm}
                          <span className="ml-0.5 text-[12px] font-semibold">{t.ampm}</span>
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] font-semibold">
                          {o.airport}
                          {o.destination ? ` → ${o.destination}` : ""}
                        </span>
                        <span className={`block truncate text-[12.5px] ${selected ? "text-paper/75" : "text-ink-2"}`}>
                          {o.city ?? o.airportName ?? o.airport}
                          {o.destinationCity ? ` to ${o.destinationCity}` : ""}
                          {o.terminal ? ` · Terminal ${o.terminal}` : ""}
                          {o.departed ? " · Departed" : o.cancelled ? " · Cancelled" : ""}
                        </span>
                      </span>
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${selected ? "border-paper bg-paper text-ink" : "border-line"}`}>
                        {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            ) : null}

            {/* A usual time is a starting point; the traveler confirms the real one. */}
            {!manualOpen && picked && result?.status === "typical" ? (
              <label className="field !min-h-[50px]">
                <span className="shrink-0 text-[13.5px] text-ink-2">Departure time from {picked.airport}</span>
                <input
                  type="time"
                  aria-label="Your departure time"
                  className="text-right"
                  value={picked.time}
                  onChange={(e) => e.target.value && onPickRef.current({ ...picked, time: e.target.value }, key)}
                />
              </label>
            ) : null}

            {manualOpen ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="field !min-h-[50px]">
                  <input
                    aria-label="Departure airport code"
                    placeholder="Airport (SFO)"
                    maxLength={3}
                    className="uppercase"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    value={manual.airport}
                    onChange={(e) => onManual({ manual: { ...manual, airport: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") } })}
                  />
                </div>
                <div className="field !min-h-[50px]">
                  <input aria-label="Departure time" type="time" value={manual.departureTime} onChange={(e) => onManual({ manual: { ...manual, departureTime: e.target.value } })} />
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[13px] font-semibold text-ink-2">
              {manualOpen && open.length ? (
                <button type="button" className="underline underline-offset-4" onClick={() => onManual({ manualOpen: false })}>
                  Pick from the schedule
                </button>
              ) : null}
              {!manualOpen ? (
                <button type="button" className="underline underline-offset-4" onClick={() => onManual({ manualOpen: true })}>
                  Not listed? Enter airport and time
                </button>
              ) : null}
              {failed || result?.status === "unavailable" ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 underline underline-offset-4"
                  onClick={() => {
                    answers.delete(key);
                    setAttempt((n) => n + 1);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Try again
                </button>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
