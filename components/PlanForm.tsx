"use client";

import { CalendarDays, Plane } from "lucide-react";

import { GateSlider } from "@/components/GateSlider";
import { OriginField } from "@/components/OriginField";
import { localDateString, prettyDate } from "@/lib/format";
import { parseFlightNumber } from "@/lib/flight-utils";
import type { Profile } from "@/lib/profile";
import type { ManualFlight, Mode, OriginInput, Perks, PlanRequest } from "@/types/plan";

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
  manual: ManualFlight;
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
    manual: { airport: "", departureTime: "" },
  };
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
    manual: req.manual ?? base.manual,
  };
}

export function toRequest(v: FormValues, includeManual: boolean): PlanRequest {
  const date = v.dateMode === "custom" ? v.customDate : localDateString(v.dateMode === "tomorrow" ? 1 : 0);
  return {
    flightNumber: v.flightNumber.trim().toUpperCase(),
    date,
    origin: v.origin,
    mode: v.mode,
    checkedBag: v.checkedBag,
    perks: v.perks,
    bufferMinutes: v.bufferMinutes,
    manual: includeManual && v.manual.airport && v.manual.departureTime ? v.manual : null,
  };
}

const perkOptions: Array<{ key: keyof Perks; label: string }> = [
  { key: "precheck", label: "TSA PreCheck" },
  { key: "clear", label: "CLEAR" },
  { key: "globalEntry", label: "Global Entry" },
  { key: "touchlessId", label: "Touchless ID" },
];

const modeOptions: Array<{ key: Mode; label: string }> = [
  { key: "ride", label: "Rideshare / taxi" },
  { key: "drive", label: "Driving" },
  { key: "transit", label: "Public transit" },
];

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
  // A picked date that is today or tomorrow snaps to that chip, so only one chip is ever lit.
  const pickDate = (value: string) => {
    if (!value) return onChange({ dateMode: "custom", customDate: "" });
    if (value === localDateString(0)) return onChange({ dateMode: "today", customDate: "" });
    if (value === localDateString(1)) return onChange({ dateMode: "tomorrow", customDate: "" });
    onChange({ dateMode: "custom", customDate: value });
  };

  return (
    <div className={`flex flex-col ${compact ? "gap-3" : "gap-4"}`}>
      <div>
        <label className="label" htmlFor="flight">
          Your flight
        </label>
        <div className="field">
          <Plane className="h-5 w-5 shrink-0 text-lilac-deep" />
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
            <button
              key={mode}
              type="button"
              className="chip date justify-center !text-[14px]"
              aria-pressed={values.dateMode === mode}
              onClick={() => onChange({ dateMode: mode, customDate: "" })}
            >
              {mode === "today" ? "Today" : "Tomorrow"}
            </button>
          ))}
          <label className="chip date relative justify-center cursor-pointer !text-[14px]" aria-pressed={values.dateMode === "custom"}>
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
          <div className="mt-2 rounded-[18px] bg-butter p-3.5">
            <p className="text-[14px] font-semibold">{notFound} Tell us the airport and departure time.</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <div className="field !min-h-[46px] !bg-paper/80">
                <input
                  aria-label="Airport code"
                  placeholder="JFK"
                  maxLength={3}
                  className="uppercase"
                  autoCapitalize="characters"
                  value={values.manual.airport}
                  onChange={(e) => onChange({ manual: { ...values.manual, airport: e.target.value.toUpperCase() } })}
                />
              </div>
              <div className="field relative !min-h-[46px] !bg-paper/80">
                <input
                  aria-label="Departure time"
                  type="time"
                  value={values.manual.departureTime}
                  onChange={(e) => onChange({ manual: { ...values.manual, departureTime: e.target.value } })}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div>
        <label className="label" htmlFor="origin">
          Leaving from
        </label>
        <OriginField value={values.origin} onChange={(origin) => onChange({ origin })} home={profile.home} recents={profile.recents} />
      </div>

      <div>
        <span className="label">Getting there</span>
        <div className="seg !grid-cols-3" role="group" aria-label="How you're getting to the airport">
          {modeOptions.map((m) => (
            <button key={m.key} type="button" className="!px-1 !text-[13px]" aria-pressed={values.mode === m.key} onClick={() => onChange({ mode: m.key })}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="label">Checking a bag?</span>
        <div className="seg" role="group" aria-label="Checking a bag">
          <button type="button" aria-pressed={!values.checkedBag} onClick={() => onChange({ checkedBag: false })}>
            No
          </button>
          <button type="button" aria-pressed={values.checkedBag} onClick={() => onChange({ checkedBag: true })}>
            Yes
          </button>
        </div>
      </div>

      <div>
        <span className="label">Skip the line</span>
        <div className="flex flex-wrap gap-2">
          {perkOptions.map((p) => (
            <button
              key={p.key}
              type="button"
              className="chip"
              aria-pressed={values.perks[p.key]}
              onClick={() => onChange({ perks: { ...values.perks, [p.key]: !values.perks[p.key] } })}
            >
              {values.perks[p.key] ? <span className="text-sage-deep">✓</span> : null}
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <GateSlider compact={compact} value={values.bufferMinutes} onChange={(bufferMinutes) => onChange({ bufferMinutes })} />
    </div>
  );
}

export function isReady(values: FormValues, notFound: string | null) {
  const flightOk = Boolean(parseFlightNumber(values.flightNumber));
  const dateOk = values.dateMode !== "custom" || /^\d{4}-\d{2}-\d{2}$/.test(values.customDate);
  const manualOk = !notFound || (values.manual.airport.trim().length === 3 && /^\d{2}:\d{2}$/.test(values.manual.departureTime));
  return flightOk && dateOk && manualOk;
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
  const ready = isReady(values, notFound);
  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onSubmit();
      }}
    >
      <h1 className="mb-5 mt-2 text-[34px] font-black leading-[1.02]">
        When do I <span className="rounded-lg bg-butter px-1">need to leave?</span>
      </h1>
      <PlanFields values={values} onChange={onChange} profile={profile} notFound={notFound} />
      <div className="pointer-events-none sticky bottom-0 mt-6 bg-gradient-to-t from-ground via-ground/95 to-transparent pb-[max(env(safe-area-inset-bottom),16px)] pt-4">
        <button type="submit" className="btn-primary pointer-events-auto" disabled={!ready}>
          {notFound ? "Try again" : "When should I leave?"}
        </button>
      </div>
    </form>
  );
}
