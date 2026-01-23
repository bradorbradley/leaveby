"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  parseFlightNumber,
  getAirlineName,
  getTerminalForAirline,
  getStatusTiers,
  isDeltaFlight,
  isAmericanFlight,
  terminals,
} from "@/lib/jfk-data";
import { format } from "date-fns";
import type { FlightInputData } from "./FlightInput";

export interface OptionsData {
  checkingBag: boolean;
  airlineStatus: string;
  hasTouchlessId: boolean;
}

interface OptionsFormProps {
  flightData: FlightInputData;
  onBack: () => void;
  onSubmit: (data: OptionsData) => void;
}

export function OptionsForm({ flightData, onBack, onSubmit }: OptionsFormProps) {
  const [checkingBag, setCheckingBag] = React.useState<string>("no");
  const [airlineStatus, setAirlineStatus] = React.useState("none");
  const [hasTouchlessId, setHasTouchlessId] = React.useState(false);

  const parsedFlight = parseFlightNumber(flightData.flightNumber);
  const airlineCode = parsedFlight?.airlineCode ?? "";
  const airlineName = getAirlineName(airlineCode);
  const terminalId = getTerminalForAirline(airlineCode);
  const terminal = terminalId ? terminals[terminalId] : null;
  const statusTiers = getStatusTiers(airlineCode);

  const showTouchlessId =
    (isDeltaFlight(airlineCode) || isAmericanFlight(airlineCode)) &&
    terminal?.securityOptions.touchlessId &&
    flightData.hasPrecheck;

  const handleSubmit = () => {
    onSubmit({
      checkingBag: checkingBag === "yes",
      airlineStatus,
      hasTouchlessId,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto"
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-text-secondary hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      {/* Flight Summary Card */}
      <Card className="mb-8">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <Plane className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-lg text-foreground">
              {airlineName} {parsedFlight?.number}
            </h2>
            <p className="text-text-secondary">
              {format(flightData.date, "EEEE, MMM d")} • Terminal {terminalId}
            </p>
            {terminal?.primaryAirline && (
              <p className="text-sm text-text-muted mt-1">
                {terminal.name}
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {/* Checking a Bag */}
        <ToggleGroup
          label="Are you checking a bag?"
          value={checkingBag}
          onValueChange={setCheckingBag}
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
        />

        {/* Airline Status */}
        <Select
          label="Your airline status"
          value={airlineStatus}
          onValueChange={setAirlineStatus}
          options={statusTiers.map((tier) => ({
            value: tier.value,
            label: tier.label,
          }))}
        />

        {/* Touchless ID (conditional) */}
        {showTouchlessId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-success/10 rounded-xl p-2"
          >
            <Checkbox
              checked={hasTouchlessId}
              onCheckedChange={setHasTouchlessId}
              label={`${isDeltaFlight(airlineCode) ? "Delta" : "American"} Touchless ID`}
              description="Fastest security option available"
            />
          </motion.div>
        )}

        {/* Terminal Notes */}
        {terminal && terminal.notes.length > 0 && (
          <div className="bg-muted rounded-xl p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              Terminal {terminalId} notes:
            </p>
            <ul className="text-sm text-text-secondary space-y-1">
              {terminal.notes.slice(0, 2).map((note, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit Button */}
        <Button onClick={handleSubmit} className="w-full" size="lg">
          Calculate my time
        </Button>
      </div>
    </motion.div>
  );
}
