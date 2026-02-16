"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plane } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { DateSelector } from "@/components/ui/date-selector";

// Top 10 US airports by passenger volume
const AIRPORTS = [
  { value: "ATL", label: "Atlanta (ATL)" },
  { value: "DFW", label: "Dallas/Fort Worth (DFW)" },
  { value: "DEN", label: "Denver (DEN)" },
  { value: "ORD", label: "Chicago O'Hare (ORD)" },
  { value: "LAX", label: "Los Angeles (LAX)" },
  { value: "JFK", label: "New York JFK (JFK)" },
  { value: "LAS", label: "Las Vegas (LAS)" },
  { value: "MCO", label: "Orlando (MCO)" },
  { value: "MIA", label: "Miami (MIA)" },
  { value: "CLT", label: "Charlotte (CLT)" },
];

export interface FlightInputData {
  flightNumber: string;
  airport: string;
  date: Date;
  origin: string;
  hasPrecheck: boolean;
  hasClear: boolean;
  hasGlobalEntry: boolean;
}

interface FlightInputProps {
  onSubmit: (data: FlightInputData) => void;
}

export function FlightInput({ onSubmit }: FlightInputProps) {
  const [flightNumber, setFlightNumber] = React.useState("");
  const [airport, setAirport] = React.useState("JFK");
  const [date, setDate] = React.useState(new Date());
  const [origin, setOrigin] = React.useState("");
  const [hasPrecheck, setHasPrecheck] = React.useState(false);
  const [hasClear, setHasClear] = React.useState(false);
  const [hasGlobalEntry, setHasGlobalEntry] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Simple validation - just check format
    const cleaned = flightNumber.replace(/\s+/g, "").toUpperCase();
    const validFormat = /^[A-Z]{2}\d+$/.test(cleaned);

    if (!flightNumber.trim()) {
      newErrors.flightNumber = "Please enter your flight number";
    } else if (!validFormat) {
      newErrors.flightNumber = "Enter flight number like DL405 or AA1234";
    }

    if (!origin.trim()) {
      newErrors.origin = "Please enter where you're leaving from";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      flightNumber: cleaned,
      airport,
      date,
      origin: origin.trim(),
      hasPrecheck,
      hasClear,
      hasGlobalEntry,
    });
  };

  const selectedAirport = AIRPORTS.find(a => a.value === airport);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      {/* Logo/Brand */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4"
        >
          <Plane className="w-8 h-8 text-primary-foreground" />
        </motion.div>
        <h1 className="font-display text-3xl font-bold text-primary mb-2">
          LeaveBy
        </h1>
        <p className="text-text-secondary">
          When should you leave for the airport?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Airport Selector */}
        <Select
          label="Which airport?"
          value={airport}
          onValueChange={setAirport}
          options={AIRPORTS}
        />

        {/* Flight Number */}
        <Input
          label="Flight number"
          placeholder="e.g., DL405"
          value={flightNumber}
          onChange={(e) => {
            setFlightNumber(e.target.value);
            setErrors((prev) => ({ ...prev, flightNumber: "" }));
          }}
          error={errors.flightNumber}
        />

        {/* Date Selector */}
        <DateSelector
          label="When are you flying?"
          value={date}
          onValueChange={setDate}
        />

        {/* Origin */}
        <Input
          label="Where are you leaving from?"
          placeholder="Address, zip, or neighborhood"
          value={origin}
          onChange={(e) => {
            setOrigin(e.target.value);
            setErrors((prev) => ({ ...prev, origin: "" }));
          }}
          hint="We don't store your location"
          error={errors.origin}
        />

        {/* Security Status */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground mb-3">
            Security status
          </label>
          <div className="space-y-1 bg-muted rounded-xl p-2">
            <Checkbox
              checked={hasPrecheck}
              onCheckedChange={setHasPrecheck}
              label="TSA PreCheck"
            />
            <Checkbox
              checked={hasClear}
              onCheckedChange={setHasClear}
              label="CLEAR"
            />
            <Checkbox
              checked={hasGlobalEntry}
              onCheckedChange={setHasGlobalEntry}
              label="Global Entry"
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" size="lg">
          Continue
        </Button>
      </form>
    </motion.div>
  );
}
