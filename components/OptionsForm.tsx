"use client";

import { ArrowLeft, Calculator, ScanFace } from "lucide-react";

import { FlightSummaryCard } from "@/components/FlightSummaryCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStatusOptions } from "@/lib/airline-status-options";
import type { OptionsFormValues } from "@/types/forms";
import type { FlightInfo } from "@/types/flight";

export function OptionsForm({
  flight,
  values,
  onChange,
  onBack,
  onCalculate,
}: {
  flight: FlightInfo | null;
  values: OptionsFormValues;
  onChange: (patch: Partial<OptionsFormValues>) => void;
  onBack: () => void;
  onCalculate: () => void;
}) {
  const statusOptions = getStatusOptions(flight?.airlineCode ?? "");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {flight ? <FlightSummaryCard flight={flight} /> : null}

      <div className="glass-card space-y-6 p-6 sm:p-8">
        <div>
          <p className="section-label">Options</p>
          <h2 className="mt-2 text-3xl">A few details that change the math</h2>
        </div>

        <div className="space-y-5">
          <div>
            <Label className="field-label">Are you checking a bag?</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={toggleClass(values.checkedBag)}
                onClick={() => onChange({ checkedBag: true })}
              >
                Yes
              </button>
              <button
                type="button"
                className={toggleClass(!values.checkedBag)}
                onClick={() => onChange({ checkedBag: false })}
              >
                No
              </button>
            </div>
          </div>

          <div>
            <Label className="field-label">Your airline status</Label>
            <Select value={values.airlineStatus} onValueChange={(airlineStatus) => onChange({ airlineStatus })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {flight?.airlineCode === "DL" ? (
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-white/75 p-4 text-sm">
              <Checkbox
                checked={values.hasTouchlessId}
                onCheckedChange={(checked) => onChange({ hasTouchlessId: Boolean(checked) })}
              />
              <ScanFace className="h-4 w-4 text-accent" />
              <span>I have Delta Touchless ID</span>
            </label>
          ) : null}
        </div>

        <Button size="lg" variant="coral" className="w-full" onClick={onCalculate}>
          <Calculator className="h-4 w-4" />
          Calculate my time
        </Button>
      </div>
    </div>
  );
}

function toggleClass(active: boolean) {
  return `rounded-2xl border px-4 py-4 text-sm transition ${
    active ? "border-accent bg-accent/10 text-primary" : "border-border bg-white/85 text-muted-foreground"
  }`;
}
