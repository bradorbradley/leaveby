"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback } from "react";
import { CalendarDays, Check } from "lucide-react";

import { PlaneGlyph } from "@/components/Glyphs";

import { FlightPicker, legKey } from "@/components/FlightPicker";
import { GateSlider } from "@/components/GateSlider";
import { OriginField } from "@/components/OriginField";
import { localDateString, prettyDate } from "@/lib/format";
import { parseFlightNumber } from "@/lib/flight-utils";
import type { Profile } from "@/lib/profile";
import type { LegChoice, ManualFlight, Mode, OriginInput, Perks, PlanRequest } from "@/types/plan";

type DateMode = "today" | "tomorrow" | "custom";

export interface FormValues {
  flightNumber: string;
  dateMode: DateMode;
  customDate: string;
  origin: OriginInput | null;
  mode: Mode;
  checkedBag: boolean;
  perks: Perks;
  bufferMinutes: number;
  /** The departure picked from the schedule, and the flight|date it belongs to. */
  leg: LegChoice | null;
  legFor: string;
  /** Airport and time typed in by hand, used when manualOpen. */
  manual: ManualFlight;
  manualOpen: boolean;
}

export function initialValues(profile: Profile): FormValues {
  const hour = new Date().getHours();
  return {
    flightNumber: "",
    dateMode: hour >= 20 ? "tomorrow" : "today",
    customDate: "",
    origin: profile.home ? { label: profile.home.label, lat: profile.home.lat, lon: profile.home.lon } : null,
    mode: profile.mode,
    checkedBag: false,
    perks: { ...profile.perks },
    bufferMinutes: profile.bufferMinutes,
    leg: null,
    legFor: "",
    manual: { airport: "", departureTime: "" },
    manualOpen: false,
  };
}

export function formDate(v: Pick<FormValues, "dateMode" | "customDate">) {
  return v.dateMode === "custom" ? v.customDate : localDateString(v.dateMode === "tomorrow" ? 1 : 0);
}

/** The departure the traveler confirmed for the flight and date currently entered, or null. */
export function confirmedLeg(v: FormValues): LegChoice | null {
  if (v.manualOpen) {
    const airport = v.manual.airport.trim().toUpperCase();
    return /^[A-Z]{3}$/.test(airport) && /^\d{2}:\d{2}$/.test(v.manual.departureTime) ? { airport, time: v.manual.departureTime, confirmed: "traveler" } : null;
  }
  return v.leg && v.legFor && v.legFor === legKey(v.flightNumber, formDate(v)) ? v.leg : null;
}

/** Rebuild form values from a shared link or a previous run. */
export function valuesFromRequest(req: PlanRequest, profile: Profile): FormValues {
  const base = initialValues(profile);
  const dateMode: DateMode = req.date === localDateString(0) ? "today" : req.date === localDateString(1) ? "tomorrow" : "custom";
  return {
    ...base,
    flightNumber: req.flightNumber,
    dateMode,
    customDate: dateMode === "custom" ? req.date : "",
    origin: req.origin ?? null,
    mode: req.mode ?? base.mode,
    checkedBag: req.checkedBag,
    perks: { ...req.perks },
    bufferMinutes: req.bufferMinutes,
    leg: req.leg ?? null,
    legFor: req.leg ? legKey(req.flightNumber, req.date) : "",
    manual: req.manual ?? base.manual,
    manualOpen: Boolean(!req.leg && req.manual),
  };
}

export function toRequest(v: FormValues): PlanRequest {
  const date = formDate(v);
  return {
    flightNumber: v.flightNumber.trim().toUpperCase(),
    date,
    origin: v.origin,
    mode: v.mode,
    checkedBag: v.checkedBag,
    perks: v.perks,
    bufferMinutes: v.bufferMinutes,
    leg: confirmedLeg(v),
  };
}

export const perkOptions: Array<{ key: keyof Perks; label: string }> = [
  { key: "precheck", label: "TSA PreCheck" },
  { key: "clear", label: "CLEAR" },
  { key: "globalEntry", label: "Global Entry" },
  { key: "touchlessId", label: "Touchless ID" },
];

const modeOptions: Array<{ key: Mode; label: string }> = [
  { key: "ride", label: "Rideshare / taxi" },
  { key: "drive", label: "Driving" },
  { key: "transit", label: "Transit" },
];

const spring = { type: "spring", stiffness: 380, damping: 32 } as const;

/** A segmented control whose ink pill slides between options. */
export function Seg<T extends string>({
  id,
  options,
  value,
  onChange,
  label,
  cols,
}: {
  id: string;
  options: Array<{ key: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  label: string;
  cols?: number;
}) {
  return (
    <div className="seg" role="group" aria-label={label} style={cols ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } : undefined}>
      {options.map((o) => (
        <button key={o.key} type="button" aria-pressed={value === o.key} onClick={() => onChange(o.key)} className="!px-1">
          {value === o.key ? <motion.span layoutId={`seg-${id}`} transition={spring} className="absolute inset-0 rounded-[14px] bg-ink" /> : null}
          <span className="relative z-10">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** A toggle chip with a tick that grows in. */
export function Chip({ pressed, onClick, children, className = "" }: { pressed: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <motion.button type="button" className={`chip ${className}`} aria-pressed={pressed} onClick={onClick} whileTap={{ scale: 0.96 }}>
      <motion.span initial={false} animate={{ width: pressed ? 16 : 0, opacity: pressed ? 1 : 0 }} transition={spring} className="inline-flex overflow-hidden">
        <Check className="h-4 w-4 shrink-0" />
      </motion.span>
      {children}
    </motion.button>
  );
}

export function PlanFields({
  values,
  onChange,
  profile,
  notFound,
  compact = false,
}: {
  values: FormValues;
  onChange: (patch: Partial<FormValues>) => void;
  profile: Profile;
  notFound: string | null;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const onPick = useCallback((leg: LegChoice | null, legFor: string) => onChange({ leg, legFor }), [onChange]);
  const onManual = useCallback((patch: { manual?: ManualFlight; manualOpen?: boolean }) => onChange(patch), [onChange]);
  // A picked date that is today or tomorrow snaps to that chip, so only one chip is ever lit.
  const pickDate = (value: string) => {
    if (!value) return onChange({ dateMode: "custom", customDate: "" });
    if (value === localDateString(0)) return onChange({ dateMode: "today", customDate: "" });
    if (value === localDateString(1)) return onChange({ dateMode: "tomorrow", customDate: "" });
    onChange({ dateMode: "custom", customDate: value });
  };

  const segId = compact ? "c" : "f";
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 14 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 26 } },
  } as const;

  return (
    <motion.div
      className={`flex flex-col ${compact ? "gap-3" : "gap-5"}`}
      variants={{ hidden: {}, show: { transition: { staggerChildren: compact ? 0 : 0.06, delayChildren: compact ? 0 : 0.05 } } }}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <label className="label" htmlFor="flight">
          Your flight
        </label>
        <div className="field">
          <span className="shrink-0 text-coral">
            <PlaneGlyph size={22} takeoff={Boolean(parseFlightNumber(values.flightNumber))} key={parseFlightNumber(values.flightNumber) ? values.flightNumber.trim() : "idle"} />
          </span>
          <input
            id="flight"
            value={values.flightNumber}
            placeholder="DL 405"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            enterKeyHint="next"
            className="uppercase"
            onChange={(e) => onChange({ flightNumber: e.target.value.toUpperCase() })}
          />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {(["today", "tomorrow"] as const).map((mode) => (
            <motion.button
              key={mode}
              type="button"
              className="chip justify-center"
              aria-pressed={values.dateMode === mode}
              whileTap={{ scale: 0.96 }}
              onClick={() => onChange({ dateMode: mode, customDate: "" })}
            >
              {mode === "today" ? "Today" : "Tomorrow"}
            </motion.button>
          ))}
          <label className="chip relative cursor-pointer justify-center" aria-pressed={values.dateMode === "custom"}>
            <CalendarDays className="h-4 w-4" />
            {values.dateMode === "custom" && values.customDate ? prettyDate(values.customDate) : "Pick"}
            <input
              type="date"
              aria-label="Pick a date"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              min={localDateString(0)}
              value={values.dateMode === "custom" ? values.customDate : ""}
              onChange={(e) => pickDate(e.target.value)}
            />
          </label>
        </div>
        {notFound ? (
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2 rounded-[18px] bg-mustard-soft px-4 py-3 text-[14px] font-medium" role="alert">
            {notFound}
          </motion.p>
        ) : null}
        <FlightPicker
          flightNumber={values.flightNumber}
          date={formDate(values)}
          leg={values.leg}
          legFor={values.legFor}
          manual={values.manual}
          manualOpen={values.manualOpen}
          onPick={onPick}
          onManual={onManual}
          compact={compact}
        />
      </motion.div>

      <motion.div variants={item}>
        <label className="label" htmlFor="origin">
          Leaving from
        </label>
        <OriginField value={values.origin} onChange={(origin) => onChange({ origin })} home={profile.home} recents={profile.recents} />
      </motion.div>

      <motion.div variants={item}>
        <span className="label">Getting there</span>
        <Seg id={`${segId}-mode`} options={modeOptions} value={values.mode} onChange={(mode) => onChange({ mode })} label="How you're getting to the airport" cols={3} />
      </motion.div>

      <motion.div variants={item}>
        <span className="label">Checking a bag?</span>
        <Seg
          id={`${segId}-bag`}
          options={[
            { key: "no", label: "No" },
            { key: "yes", label: "Yes" },
          ]}
          value={values.checkedBag ? "yes" : "no"}
          onChange={(v) => onChange({ checkedBag: v === "yes" })}
          label="Checking a bag"
        />
      </motion.div>

      <motion.div variants={item}>
        <span className="label">Skip the line</span>
        <div className="flex flex-wrap gap-2">
          {perkOptions.map((p) => (
            <Chip key={p.key} pressed={values.perks[p.key]} onClick={() => onChange({ perks: { ...values.perks, [p.key]: !values.perks[p.key] } })}>
              {p.label}
            </Chip>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <GateSlider compact={compact} value={values.bufferMinutes} onChange={(bufferMinutes) => onChange({ bufferMinutes })} />
      </motion.div>
    </motion.div>
  );
}

/** Ready only once the traveler has confirmed which departure they're on. */
export function isReady(values: FormValues) {
  const flightOk = Boolean(parseFlightNumber(values.flightNumber));
  const dateOk = values.dateMode !== "custom" || /^\d{4}-\d{2}-\d{2}$/.test(values.customDate);
  return flightOk && dateOk && Boolean(confirmedLeg(values));
}

export function PlanForm({
  values,
  onChange,
  onSubmit,
  profile,
  notFound,
}: {
  values: FormValues;
  onChange: (patch: Partial<FormValues>) => void;
  onSubmit: () => void;
  profile: Profile;
  notFound: string | null;
}) {
  const ready = isReady(values);
  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onSubmit();
      }}
    >
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="display-soft mb-6 mt-3 text-[42px] leading-[1.02]"
      >
        When do I need
        <br />
        to <em className="font-normal italic text-coral">leave?</em>
      </motion.h1>
      <PlanFields values={values} onChange={onChange} profile={profile} notFound={notFound} />
      <div className="pointer-events-none sticky bottom-0 mt-6 bg-gradient-to-t from-ground via-ground/95 to-transparent pb-[max(env(safe-area-inset-bottom),16px)] pt-5">
        <button type="submit" className="btn-primary pointer-events-auto" disabled={!ready}>
          {ready ? (notFound ? "Try again" : "When should I leave?") : parseFlightNumber(values.flightNumber) ? "Pick your departure above" : "When should I leave?"}
        </button>
      </div>
    </form>
  );
}
