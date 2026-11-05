/**
 * A traveler with PreCheck reached security after the lane had closed. The plan had counted on
 * PreCheck's short wait. When we hold a terminal's lane hours, the plan must switch to standard
 * lanes outside them and say why.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyLaneHours } from "@/lib/lane-hours";
import type { FlightInfo } from "@/types/flight";
import type { Research } from "@/types/plan";

// JFK Terminal 5: PreCheck 6:00 AM-7:30 PM in our terminal data.
const flight: FlightInfo = {
  flightNumber: "B6 123",
  airlineCode: "B6",
  airlineName: "JetBlue",
  departureAirport: "JFK",
  departureTimezone: "America/New_York",
  departureTime: "2026-11-06T02:00:00.000Z", // 9:00 PM in New York
  terminal: "5",
  gate: null,
  status: "scheduled",
  delayMinutes: 0,
  region: "domestic",
  source: "test",
  notes: [],
};
const research = { lane: "TSA PreCheck", securityMinutes: 8, securityNotes: ["PreCheck usually runs about 8 minutes."] } as Research;

describe("expedited lane hours", () => {
  it("switches to standard lanes after PreCheck closes", () => {
    const r = applyLaneHours(flight, research, "2026-11-06T00:45:00.000Z"); // 7:45 PM
    assert.equal(r.lane, "standard lanes");
    assert.ok(r.securityMinutes >= 20, `security ${r.securityMinutes}`);
    assert.match(r.securityNotes[0], /PreCheck at Terminal 5 closes at 7:30 PM/);
  });

  it("switches to standard lanes before PreCheck opens", () => {
    const r = applyLaneHours(flight, research, "2026-11-05T10:15:00.000Z"); // 5:15 AM
    assert.equal(r.lane, "standard lanes");
    assert.match(r.securityNotes[0], /opens at 6:00 AM/);
  });

  it("leaves the plan alone while the lane is open", () => {
    assert.equal(applyLaneHours(flight, research, "2026-11-05T17:00:00.000Z"), research); // noon
  });

  it("does nothing without hours for that exact terminal", () => {
    assert.equal(applyLaneHours({ ...flight, terminal: "99" }, research, "2026-11-06T00:45:00.000Z"), research);
    assert.equal(applyLaneHours({ ...flight, departureAirport: "DEN" }, research, "2026-11-06T00:45:00.000Z"), research);
    assert.equal(applyLaneHours(flight, { ...research, lane: "standard lanes" }, "2026-11-06T00:45:00.000Z").lane, "standard lanes");
  });
});
