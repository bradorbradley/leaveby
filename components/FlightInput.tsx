"use client";

import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, MapPin, Plane, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAirports } from "@/lib/airports";
import type { FlightFormValues } from "@/types/forms";

const dateOptions: Array<{ value: FlightFormValues["datePreset"]; label: string }> = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "custom", label: "Choose date" },
];

export function FlightInput({
  values,
  onChange,
  onContinue,
}: {
  values: FlightFormValues;
  onChange: (patch: Partial<FlightFormValues>) => void;
  onContinue: () => void;
}) {
  const ready = values.flightNumber.trim() && values.origin.trim();
  const airports = listAirports();

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <section className="glass-card relative overflow-hidden p-6 sm:p-8">
        <div className="hero-noise absolute inset-0" />
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <p className="section-label">LeaveBy</p>
            <h1 className="text-balance text-4xl leading-none sm:text-5xl">When should you leave?</h1>
            <p className="max-w-md text-[15px] text-muted-foreground">
              Enter your flight, where you’re leaving from, and what security perks you have. We’ll do the airport math.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <Label className="field-label">Flight number</Label>
              <div className="input-shell flex items-center gap-3">
                <Plane className="h-4 w-4 text-accent" />
                <Input
                  placeholder="DL 405"
                  value={values.flightNumber}
                  onChange={(event) => onChange({ flightNumber: event.target.value })}
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
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      values.datePreset === option.value
                        ? "border-accent bg-accent/10 text-primary"
                        : "border-border bg-white/80 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {values.datePreset === "custom" ? (
                <div className="input-shell mt-2">
                  <Input
                    type="date"
                    value={values.customDate}
                    onChange={(event) => onChange({ customDate: event.target.value })}
                  />
                </div>
              ) : null}
            </div>

            <div>
              <Label className="field-label">Airport</Label>
              <Select value={values.airportCode} onValueChange={(airportCode) => onChange({ airportCode })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose airport" />
                </SelectTrigger>
                <SelectContent>
                  {airports.map((airport) => (
                    <SelectItem key={airport.code} value={airport.code}>
                      {airport.code} · {airport.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="field-label">Leaving from</Label>
              <div className="input-shell flex items-center gap-3">
                <MapPin className="h-4 w-4 text-accent" />
                <Input
                  placeholder="Zip, neighborhood, or address"
                  value={values.origin}
                  onChange={(event) => onChange({ origin: event.target.value })}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">We don’t store your location.</p>
            </div>

            <div>
              <Label className="field-label">Security status</Label>
              <div className="space-y-3">
                <SecurityToggle
                  checked={values.hasPreCheck}
                  icon={ShieldCheck}
                  label="TSA PreCheck"
                  onCheckedChange={(checked) => onChange({ hasPreCheck: checked })}
                />
                <SecurityToggle
                  checked={values.hasClear}
                  icon={LockKeyhole}
                  label="CLEAR"
                  onCheckedChange={(checked) => onChange({ hasClear: checked })}
                />
                <SecurityToggle
                  checked={values.hasGlobalEntry}
                  icon={ShieldCheck}
                  label="Global Entry"
                  onCheckedChange={(checked) => onChange({ hasGlobalEntry: checked })}
                />
              </div>
            </div>
          </div>

          <Button size="lg" variant="coral" className="w-full sm:w-auto" disabled={!ready} onClick={onContinue}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
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

function SecurityToggle({
  checked,
  onCheckedChange,
  label,
  icon: Icon,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  icon: typeof ShieldCheck;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-white/75 p-3 text-sm">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
      <Icon className="h-4 w-4 text-accent" />
      <span>{label}</span>
    </label>
  );
}
