"use client";

import { CalendarDays, Plane } from "lucide-react";
import { useState } from "react";

import { GateSlider } from "@/components/GateSlider";
import { OriginField } from "@/components/OriginField";
import { localDateString, prettyDate } from "@/lib/format";
import { parseFlightNumber } from "@/lib/flight-utils";
import type { Profile } from "@/lib/profile";
import type { ManualFlight, OriginInput, Perks, PlanRequest } from "@/types/plan";

type DateMode = "today" | "tomorrow" | "custom";

export interface FormValues {
  flightNumber: string;
  dateMode: DateMode;
  customDate: string;
  origin: OriginInput | null;
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
    checkedBag: false,
    perks: { ...profile.perks },
    bufferMinutes: profile.bufferMinutes,
    manual: { airport: "", departureTime: "" },
  };
}

export function toRequest(v: FormValues, includeManual: boolean): PlanRequest {
  const date = v.dateMode === "custom" ? v.customDate : localDateString(v.dateMode === "tomorrow" ? 1 : 0);
  return {
    flightNumber: v.flightNumber.trim().toUpperCase(),
    date,
    origin: v.origin,
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
  const [dateOpen, setDateOpen] = useState(false);
  const flightOk = Boolean(parseFlightNumber(values.flightNumber));
  const dateOk = values.dateMode !== "custom" || /^\d{4}-\d{2}-\d{2}$/.test(values.customDate);
  const manualOk = !notFound || (values.manual.airport.trim().length === 3 && /^\d{2}:\d{2}$/.test(values.manual.departureTime));
  const ready = flightOk && dateOk && manualOk;

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

      <div className="flex flex-col gap-4">
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
                className="chip date justify-center !min-h-[38px] !text-[13.5px]"
                aria-pressed={values.dateMode === mode}
                onClick={() => onChange({ dateMode: mode })}
              >
                {mode === "today" ? "Today" : "Tomorrow"}
              </button>
            ))}
            <label
              className="chip date relative justify-center !min-h-[38px] cursor-pointer !text-[13.5px]"
              aria-pressed={values.dateMode === "custom"}
              onClick={() => setDateOpen(true)}
            >
              <CalendarDays className="h-4 w-4" />
              {values.dateMode === "custom" && values.customDate ? prettyDate(values.customDate) : "Pick"}
              <input
                type="date"
                aria-label="Pick a date"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                min={localDateString(0)}
                value={values.customDate}
                onFocus={() => setDateOpen(true)}
                onChange={(e) => {
                  onChange({ dateMode: "custom", customDate: e.target.value });
                  setDateOpen(false);
                }}
              />
            </label>
          </div>
          {dateOpen && values.dateMode === "custom" && !values.customDate ? (
            <p className="mt-1.5 text-[12.5px] text-ink-2">Pick the departure date.</p>
          ) : null}
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

        <GateSlider value={values.bufferMinutes} onChange={(bufferMinutes) => onChange({ bufferMinutes })} />
      </div>

      <div className="sticky bottom-0 mt-6 bg-gradient-to-t from-ground via-ground to-transparent pb-4 pt-3">
        <button type="submit" className="btn-primary" disabled={!ready}>
          {notFound ? "Try again" : "When should I leave?"}
        </button>
      </div>
    </form>
  );
}
