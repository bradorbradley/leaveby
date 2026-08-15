"use client";

import { motion } from "framer-motion";
import { Briefcase, CalendarDays, Car, CarTaxiFront, MapPin, Plane, ShieldCheck, TrainFront } from "lucide-react";

import { BufferSlider } from "@/components/BufferSlider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseFlightNumber } from "@/lib/flight-utils";
import type { LeaveByFormValues, TravelMode } from "@/types/forms";

const dateOptions: Array<{ value: LeaveByFormValues["datePreset"]; label: string }> = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "custom", label: "Pick date" },
];

const modeOptions: Array<{ value: TravelMode; label: string; icon: typeof Car }> = [
  { value: "drive", label: "Driving", icon: Car },
  { value: "rideshare", label: "Rideshare", icon: CarTaxiFront },
  { value: "transit", label: "Train", icon: TrainFront },
];

const perkOptions = [
  { key: "hasPreCheck", label: "PreCheck" },
  { key: "hasClear", label: "CLEAR" },
  { key: "hasGlobalEntry", label: "Global Entry" },
] satisfies Array<{ key: keyof Pick<LeaveByFormValues, "hasPreCheck" | "hasClear" | "hasGlobalEntry">; label: string }>;

export function FlightInput({
  values,
  onChange,
  onSubmit,
}: {
  values: LeaveByFormValues;
  onChange: (patch: Partial<LeaveByFormValues>) => void;
  onSubmit: () => void;
}) {
  const ready =
    Boolean(parseFlightNumber(values.flightNumber)) &&
    (values.datePreset !== "custom" || Boolean(values.customDate));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <section className="glass-card relative overflow-hidden p-6 sm:p-8">
        <div className="hero-noise absolute inset-0" />
        <form
          className="relative z-10 space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (!ready) return;
            onSubmit();
          }}
        >
          <div className="space-y-3">
            <p className="section-label">LeaveBy</p>
            <h1 className="text-balance text-4xl leading-none sm:text-5xl">When should you leave?</h1>
            <p className="max-w-md text-[15px] text-muted-foreground">
              Enter the flight and a few travel details. We&apos;ll figure out the airport timing from there.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <Label className="field-label">Flight number</Label>
              <div className="input-shell flex min-h-12 items-center gap-3">
                <Plane className="h-4 w-4 shrink-0 text-accent" />
                <Input
                  autoCapitalize="characters"
                  autoCorrect="off"
                  className="h-12 uppercase"
                  placeholder="DL 405"
                  value={values.flightNumber}
                  onChange={(event) => onChange({ flightNumber: event.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div>
              <Label className="field-label">Date</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {dateOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange({ datePreset: option.value })}
                    className={pillButtonClass(values.datePreset === option.value)}
                  >
                    <CalendarDays className="h-4 w-4" />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
              {values.datePreset === "custom" ? (
                <div className="input-shell mt-2 flex min-h-12 items-center">
                  <Input
                    className="h-12"
                    type="date"
                    value={values.customDate}
                    onChange={(event) => onChange({ customDate: event.target.value })}
                  />
                </div>
              ) : null}
            </div>

            <div>
              <Label className="field-label">Leaving from</Label>
              <div className="input-shell flex min-h-12 items-center gap-3">
                <MapPin className="h-4 w-4 shrink-0 text-accent" />
                <Input
                  className="h-12"
                  placeholder="Zip, neighborhood, or address"
                  value={values.origin}
                  onChange={(event) => onChange({ origin: event.target.value })}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Optional — helps with travel time</p>
            </div>

            <div>
              <Label className="field-label">How are you getting there?</Label>
              <div className="grid grid-cols-3 gap-2">
                {modeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChange({ mode: option.value })}
                      className={pillButtonClass(values.mode === option.value)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="field-label">Checking a bag?</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={toggleButtonClass(values.checkedBag)}
                  onClick={() => onChange({ checkedBag: true })}
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Yes</span>
                </button>
                <button
                  type="button"
                  className={toggleButtonClass(!values.checkedBag)}
                  onClick={() => onChange({ checkedBag: false })}
                >
                  <Briefcase className="h-4 w-4" />
                  <span>No</span>
                </button>
              </div>
            </div>

            <div>
              <Label className="field-label">Security perks</Label>
              <div className="flex flex-wrap gap-2">
                {perkOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={pillButtonClass(values[option.key])}
                    onClick={() =>
                      onChange({
                        [option.key]: !values[option.key],
                      } as Pick<LeaveByFormValues, typeof option.key>)
                    }
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="field-label">Breathing room after security</Label>
              <div className="rounded-2xl border border-border bg-white/80 px-4 py-4">
                <BufferSlider value={values.bufferMinutes} onChange={(bufferMinutes) => onChange({ bufferMinutes })} />
              </div>
            </div>
          </div>

          <Button className="w-full" size="lg" type="submit" variant="coral" disabled={!ready}>
            When should I leave?
          </Button>
        </form>
      </section>

      <aside className="glass-card p-6 sm:p-8">
        <div className="space-y-4">
          <p className="section-label">What It Accounts For</p>
          <div className="space-y-3">
            {[
              "Live flight timing and delay changes",
              "Current traffic plus airport construction drag",
              "Terminal-specific security timing",
              "Bag-drop, gate walk, and buffer before boarding",
            ].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="rounded-2xl border border-border bg-white/75 p-4 text-sm text-muted-foreground"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function pillButtonClass(active: boolean) {
  return `inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm transition ${
    active
      ? "border-accent bg-accent/10 text-primary"
      : "border-border bg-white/80 text-muted-foreground hover:bg-secondary"
  }`;
}

function toggleButtonClass(active: boolean) {
  return `inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-sm transition ${
    active
      ? "border-accent bg-accent/10 text-primary"
      : "border-border bg-white/85 text-muted-foreground hover:bg-secondary"
  }`;
}
