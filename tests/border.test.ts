/**
 * International trips: passport control and US preclearance are decided by rule from the
 * airports' countries, TSA programs only count at US airports, and the plan leaves time for them.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { borderStep, usScreening } from "@/lib/border";
import { computePlan } from "@/lib/plan-math";
import { planRows } from "@/lib/plan-rows";
import type { FlightInfo } from "@/types/flight";
import type { Research, RouteEstimate } from "@/types/plan";

describe("border rules", () => {
  it("Athens to Newark leaves the Schengen area: passport control, US-bound", () => {
    const step = borderStep("ATH", "EWR");
    assert.equal(step.kind, "exit");
    assert.equal(step.usBound, true);
  });

  it("no passport control within Schengen, within a country, or leaving the US", () => {
    assert.equal(borderStep("ATH", "FRA").kind, "none");
    assert.equal(borderStep("SFO", "JFK").kind, "none");
    assert.equal(borderStep("EWR", "ATH").kind, "none");
    assert.equal(borderStep("LHR", "JFK").kind, "none");
  });

  it("US preclearance where CBP clears passengers before departure", () => {
    assert.equal(borderStep("DUB", "JFK").kind, "preclearance");
    assert.equal(borderStep("YYZ", "LGA").kind, "preclearance");
    assert.equal(borderStep("DUB", "LHR").kind, "none");
  });

  it("US territories count as the US", () => {
    assert.equal(borderStep("SJU", "EWR").kind, "none");
    assert.equal(usScreening("SJU"), true);
  });

  it("TSA programs exist only at US airports", () => {
    assert.equal(usScreening("EWR"), true);
    assert.equal(usScreening("ATH"), false);
  });
});

describe("plan with passport control", () => {
  const flight: FlightInfo = {
    flightNumber: "UA 125",
    airlineCode: "UA",
    airlineName: "United Airlines",
    departureAirport: "ATH",
    departureTimezone: "Europe/Athens",
    destinationAirportCode: "EWR",
    departureTime: "2026-09-28T07:25:00.000Z",
    terminal: null,
    gate: null,
    status: "scheduled",
    delayMinutes: 0,
    region: "international",
    source: "test",
    notes: [],
  };
  const route: RouteEstimate = { originLabel: "Syntagma", originCoord: null, freeFlowMinutes: 35, distanceKm: 33, source: "test" };
  const research: Research = {
    driveMinutes: 50,
    curbToCheckpointMinutes: 20,
    securityMinutes: 20,
    borderMinutes: 25,
    borderLabel: "Passport control",
    borderNotes: ["After security, before the A gates."],
    checkpointToGateMinutes: 10,
    boardingLeadMinutes: 50,
    bagDropCutoffMinutes: null,
    checkpoint: "Main checkpoint",
    lane: "standard lanes",
    driveNotes: [],
    securityNotes: [],
    gateNotes: [],
    headsUp: [],
    sources: [],
    confidence: "high",
    engine: "test",
  };

  it("adds passport control to the leave time and shows it as its own step", () => {
    const withBorder = computePlan({ flight, route, research, bufferMinutes: 30, checkedBag: false, now: new Date("2026-09-27T12:00:00Z") });
    const without = computePlan({ flight, route, research: { ...research, borderMinutes: 0 }, bufferMinutes: 30, checkedBag: false, now: new Date("2026-09-27T12:00:00Z") });
    assert.equal((new Date(without.leaveISO).getTime() - new Date(withBorder.leaveISO).getTime()) / 60_000, 25);
    const { rows, total } = planRows(withBorder);
    const border = rows.find((r) => r.key === "border");
    assert.equal(border?.seg?.min, 25);
    assert.equal(border?.title, "Passport control");
    assert.equal(total, (new Date(flight.departureTime).getTime() - new Date(withBorder.leaveISO).getTime()) / 60_000);
  });

  it("puts passport control first where the airport runs it first", () => {
    const plan = computePlan({ flight, route, research: { ...research, borderFirst: true }, bufferMinutes: 30, checkedBag: false });
    const keys = plan.timeline.map((s) => s.key);
    assert.deepEqual(keys, ["leave", "curb", "checkpoint", "border", "security", "gate", "boarding", "departure"]);
    const rows = planRows(plan).rows;
    assert.deepEqual(rows.map((r) => r.key), ["leave", "arrive", "border", "security", "gate", "spare", "boarding", "departure"]);
    assert.equal(rows[2].eyebrow, "In line by");
    assert.equal(rows[3].eyebrow, "Through passport control by");
    assert.equal(rows[2].seg?.min, 25);
    assert.equal(rows[3].seg?.min, 20);
  });

  it("older plans without a border step still render seven steps", () => {
    const plan = computePlan({ flight, route, research: { ...research, borderMinutes: undefined }, bufferMinutes: 30, checkedBag: false });
    assert.equal(planRows(plan).rows.length, 7);
  });
});
