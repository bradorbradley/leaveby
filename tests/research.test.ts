/**
 * A research note quoting a worst case must not become the plan. A traveler leaving Williamsburg
 * for a 6:00 AM JetBlue flight at JFK was told to leave at 2:15 AM: research took "security can
 * take up to 2 hours" as the typical wait and padded a 5 AM drive like rush hour.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sanitize } from "@/lib/research";
import type { FlightInfo } from "@/types/flight";
import type { Research, RouteEstimate } from "@/types/plan";

const flight: FlightInfo = {
  flightNumber: "B6 123",
  airlineCode: "B6",
  airlineName: "JetBlue",
  departureAirport: "JFK",
  departureTimezone: "America/New_York",
  destinationAirportCode: "LAX",
  departureTime: "2026-10-16T10:00:00.000Z", // 6:00 AM in New York
  terminal: "5",
  gate: null,
  status: "scheduled",
  delayMinutes: 0,
  region: "domestic",
  source: "test",
  notes: [],
};
const route: RouteEstimate = { originLabel: "Williamsburg", originCoord: null, freeFlowMinutes: 27, distanceKm: 24, source: "test" };
const perks = { precheck: false, clear: false, globalEntry: false, touchlessId: false };
const input = { flight, route, weather: null, checkedBag: false, perks, mode: "ride" as const };

describe("research sanity caps", () => {
  it("never plans a worst-case 2-hour security line as typical", () => {
    const r = sanitize({ securityMinutes: 120, driveMinutes: 40 } as Partial<Research>, input, "test");
    assert.ok(r.securityMinutes <= 50, `security ${r.securityMinutes}`);
    assert.ok(r.securityMinutes >= 5);
  });

  it("keeps a predawn drive close to the empty-road time", () => {
    const r = sanitize({ securityMinutes: 20, driveMinutes: 85 } as Partial<Research>, input, "test");
    assert.ok(r.driveMinutes <= Math.round(27 * 1.5) + 15, `drive ${r.driveMinutes}`);
  });

  it("still allows a long rush-hour drive", () => {
    const evening = { ...input, flight: { ...flight, departureTime: "2026-10-16T22:00:00.000Z" } }; // 6 PM, on the road ~3:30 PM Friday
    const r = sanitize({ securityMinutes: 25, driveMinutes: 70 } as Partial<Research>, evening, "test");
    assert.equal(r.driveMinutes, 70);
  });

  it("allows a long line where the terminal is genuinely busy, up to 90 minutes", () => {
    const r = sanitize({ securityMinutes: 200, driveMinutes: 40 } as Partial<Research>, input, "test");
    assert.ok(r.securityMinutes <= 90);
  });
});
