/**
 * The flight a plan is built on must be the one the traveler is on. These tests pin that down
 * with real schedule pages (saved in fixtures/) for UA 1564, which flies IAD → DFW → ORD → SAN
 * every day, and DL 212, which flies one leg (JFK → ATH).
 *
 * Run: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, it } from "node:test";

import { getAirportProfile } from "@/lib/airports";
import { clearScheduleCache, leadingJsonObject, mergeLegs, parseFlightAware, parseFlightStats } from "@/lib/flight-legs";
import { FlightNotFoundError, flightOptions, legForPlan, liveLeg, matchLeg, resolveLeg } from "@/lib/resolve-flight";
import { parsePlanQuery, planQuery } from "@/lib/ride-links";
import type { PlanRequest } from "@/types/plan";

const fixture = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
const faUA1564 = fixture("flightaware-UAL1564.json");
const fsUA1564 = fixture("flightstats-UA1564.json");
const fsDL212 = fixture("flightstats-DL212.json");

/** Before any of the fixture flights leave. */
const NOW = new Date("2026-09-26T04:00:00Z");

const faPage = (bootstrap: unknown) => `<html><script>var trackpollBootstrap = ${JSON.stringify(bootstrap)};</script></html>`;
const fsPage = (tracker: unknown) =>
  `<html><script>__NEXT_DATA__ = ${JSON.stringify({ props: { initialState: { flightTracker: tracker } } })};__NEXT_LOADED_PAGES__=[];</script></html>`;

type Route = { fa?: string | number; fs?: string | number };
let routes: Record<string, Route> = {};
const realFetch = globalThis.fetch;

/** Serve saved pages instead of the network. A number is an HTTP error status. */
function serve(r: Record<string, Route>) {
  routes = r;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const fa = url.match(/flightaware\.com\/live\/flight\/(\w+)/);
    const fs = url.match(/flightstats\.com\/v2\/flight-tracker\/(\w+)\/(\w+)/);
    const key = fa ? fa[1] : fs ? `${fs[1]}${fs[2]}` : "";
    const body = fa ? routes[key]?.fa : fs ? routes[key]?.fs : undefined;
    if (body === undefined) return new Response("not found", { status: 404 });
    if (typeof body === "number") return new Response("blocked", { status: body });
    return new Response(body, { status: 200 });
  }) as typeof fetch;
}

beforeEach(() => clearScheduleCache());
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("schedule parsing", () => {
  it("reads every leg of a multi-leg flight from FlightStats, in local time", () => {
    const { legs, coveredDates } = parseFlightStats(fsUA1564);
    const sep26 = legs.filter((l) => l.localDate === "2026-09-26").map((l) => `${l.airport}>${l.destination} ${l.localTime}`);
    assert.deepEqual(sep26, ["IAD>DFW 12:35", "DFW>ORD 16:21", "ORD>SAN 20:16"]);
    const ord = legs.find((l) => l.airport === "ORD" && l.localDate === "2026-09-26")!;
    assert.equal(ord.timezone, "America/Chicago");
    assert.equal(ord.scheduledISO, "2026-09-27T01:16:00.000Z");
    // The trailing empty day hasn't loaded yet; it must not read as "doesn't fly".
    assert.ok(!coveredDates.includes("2026-09-29"));
    assert.ok(coveredDates.includes("2026-09-26"));
  });

  it("reads FlightAware legs with terminals, in the origin's local date", () => {
    const { legs } = parseFlightAware(faUA1564);
    const ord = legs.filter((l) => l.airport === "ORD" && l.localDate === "2026-09-26");
    assert.equal(ord.length, 1, "duplicate legs are collapsed");
    assert.equal(ord[0].localTime, "20:16");
    assert.equal(ord[0].terminal, "1");
    assert.equal(ord[0].destination, "SAN");
  });

  it("merges sources without listing a departure twice", () => {
    const merged = mergeLegs(parseFlightAware(faUA1564).legs, parseFlightStats(fsUA1564).legs);
    const sep26 = merged.filter((l) => l.localDate === "2026-09-26");
    assert.deepEqual(
      sep26.map((l) => `${l.airport}:${l.source}`),
      ["IAD:FlightAware", "DFW:FlightAware", "ORD:FlightAware"],
    );
  });

  it("finds where embedded JSON ends even with script after it", () => {
    const text = `x = {"a":"}{\\"","b":{"c":[1,2]}};y=function(){return {}}`;
    assert.equal(leadingJsonObject(text, 4), `{"a":"}{\\"","b":{"c":[1,2]}}`);
  });
});

describe("flight options: the traveler picks, we never guess", () => {
  it("lists all three UA 1564 departures and picks none", async () => {
    serve({ UAL1564: { fa: faPage(faUA1564), fs: fsPage(fsUA1564) }, UA1564: { fs: fsPage(fsUA1564) } });
    const result = await flightOptions("UA1564", "2026-09-26", NOW);
    assert.equal(result.status, "exact");
    assert.deepEqual(
      result.options.map((o) => `${o.airport}>${o.destination} ${o.time}`),
      ["IAD>DFW 12:35", "DFW>ORD 16:21", "ORD>SAN 20:16"],
    );
  });

  it("still lists every departure when one source is blocked", async () => {
    serve({ UAL1564: { fa: 403 }, UA1564: { fs: fsPage(fsUA1564) } });
    const result = await flightOptions("UA 1564", "2026-09-26", NOW);
    assert.equal(result.options.length, 3);
  });

  it("says schedules are unreachable instead of guessing when both sources fail", async () => {
    serve({ UAL1564: { fa: 403 }, UA1564: { fs: 403 } });
    const result = await flightOptions("UA1564", "2026-09-26", NOW);
    assert.equal(result.status, "unavailable");
    assert.equal(result.options.length, 0);
  });

  it("offers usual routes to confirm for dates beyond the published schedule", async () => {
    serve({ UAL1564: { fa: faPage(faUA1564) }, UA1564: { fs: fsPage(fsUA1564) } });
    const result = await flightOptions("UA1564", "2026-10-21", NOW);
    assert.equal(result.status, "typical");
    assert.deepEqual(result.options.map((o) => o.airport).sort(), ["DFW", "IAD", "ORD"]);
    assert.ok(result.options.every((o) => !o.exact && o.departureISO === null));
  });

  it("reports a flight number with no schedule as not found", async () => {
    serve({});
    const result = await flightOptions("ZZ 9999", "2026-09-26", NOW);
    assert.ok(["not_found", "unavailable"].includes(result.status));
    assert.equal(result.options.length, 0);
  });

  it("marks departures that already left", async () => {
    serve({ UAL1564: { fa: faPage(faUA1564) }, UA1564: { fs: fsPage(fsUA1564) } });
    const result = await flightOptions("UA1564", "2026-09-26", new Date("2026-09-26T18:00:00Z"));
    assert.deepEqual(result.options.map((o) => o.departed), [true, false, false]);
  });
});

describe("planning the chosen departure", () => {
  it("plans exactly the airport picked, with its live terminal", async () => {
    serve({ UAL1564: { fa: faPage(faUA1564) }, UA1564: { fs: fsPage(fsUA1564) } });
    const flight = await resolveLeg("UA1564", "2026-09-26", { airport: "ORD", time: "20:16", destination: "SAN", confirmed: "schedule" });
    assert.equal(flight.departureAirport, "ORD");
    assert.equal(flight.destinationAirportCode, "SAN");
    assert.equal(flight.departureTimezone, "America/Chicago");
    assert.equal(flight.terminal, "1");
    // Scheduled 8:16 PM; FlightAware estimates 8 minutes late, and the plan uses the later time.
    assert.equal(flight.delayMinutes, 8);
    assert.equal(new Date(flight.departureTime).toISOString(), "2026-09-27T01:24:00.000Z");
  });

  it("never swaps the traveler's airport for another leg", async () => {
    serve({ UAL1564: { fa: faPage(faUA1564) }, UA1564: { fs: fsPage(fsUA1564) } });
    const flight = await resolveLeg("UA1564", "2026-09-26", { airport: "SFO", time: "06:15", confirmed: "traveler" });
    assert.equal(flight.departureAirport, "SFO");
    assert.equal(flight.departureTimezone, "America/Los_Angeles");
    assert.equal(flight.departureLocalLabel, "Sat, Sep 26 • 6:15am");
  });

  it("uses the traveler's time but says so when the schedule differs", async () => {
    serve({ UAL1564: { fa: faPage(faUA1564) }, UA1564: { fs: fsPage(fsUA1564) } });
    const flight = await resolveLeg("UA1564", "2026-09-26", { airport: "ORD", time: "06:15", confirmed: "traveler" });
    assert.equal(flight.departureLocalLabel, "Sat, Sep 26 • 6:15am");
    assert.match(flight.notes.join(" "), /8:16 PM/);
  });

  it("works when schedules are unreachable, from what the traveler entered", async () => {
    serve({ UAL1564: { fa: 403 }, UA1564: { fs: 403 } });
    const flight = await resolveLeg("UA1564", "2026-09-26", { airport: "SNA", time: "11:45", confirmed: "traveler" });
    assert.equal(flight.departureAirport, "SNA");
    assert.equal(flight.departureTimezone, "America/Los_Angeles");
  });

  it("rejects an airport code that doesn't exist", async () => {
    serve({});
    await assert.rejects(resolveLeg("UA1564", "2026-09-26", { airport: "QQX", time: "06:15", confirmed: "traveler" }), FlightNotFoundError);
  });

  it("won't plan a multi-leg flight without a chosen departure", async () => {
    serve({ UAL1564: { fa: faPage(faUA1564) }, UA1564: { fs: fsPage(fsUA1564) } });
    const body: PlanRequest = { flightNumber: "UA 1564", date: "2026-09-26", checkedBag: false, perks: { precheck: false, clear: false, globalEntry: false, touchlessId: false }, bufferMinutes: 30 };
    assert.equal(await legForPlan(body, NOW), null);
    const chosen = await legForPlan({ ...body, leg: { airport: "DFW", time: "16:21", confirmed: "schedule" } }, NOW);
    assert.equal(chosen?.airport, "DFW");
  });

  it("plans an old link without a departure only when there is exactly one", async () => {
    serve({ DAL212: { fa: 404 }, DL212: { fs: fsPage(fsDL212) } });
    const body: PlanRequest = { flightNumber: "DL 212", date: "2026-09-27", checkedBag: false, perks: { precheck: false, clear: false, globalEntry: false, touchlessId: false }, bufferMinutes: 30 };
    const chosen = await legForPlan(body, NOW);
    assert.deepEqual(chosen, { airport: "JFK", time: "20:25", destination: "ATH", confirmed: "schedule" });
  });

  it("checks live status only for the same airport and time", async () => {
    serve({ UAL1564: { fa: faPage(faUA1564) }, UA1564: { fs: fsPage(fsUA1564) } });
    assert.equal((await liveLeg("UA1564", "2026-09-26", "DFW", "16:21"))?.airport, "DFW");
    assert.equal(await liveLeg("UA1564", "2026-09-26", "SFO", "06:15"), null);
  });

  it("matches a schedule leg only near the chosen time", () => {
    const { legs } = parseFlightAware(faUA1564);
    assert.equal(matchLeg(legs, "ORD", "2026-09-26", "2026-09-27T01:16:00Z")?.localTime, "20:16");
    assert.equal(matchLeg(legs, "ORD", "2026-09-26", "2026-09-26T11:15:00Z"), null);
  });
});

describe("links and airports", () => {
  it("keeps the chosen departure in a shared link", () => {
    const request: PlanRequest = {
      flightNumber: "UA 1564",
      date: "2026-09-26",
      origin: { label: "Home", lat: 41.9, lon: -87.6 },
      checkedBag: false,
      perks: { precheck: true, clear: false, globalEntry: false, touchlessId: false },
      bufferMinutes: 30,
      leg: { airport: "ORD", time: "20:16", destination: "SAN", confirmed: "schedule" },
    };
    assert.deepEqual(parsePlanQuery(`?${planQuery(request)}`)?.leg, request.leg);
  });

  it("gives every airport its real timezone, not a default", () => {
    assert.equal(getAirportProfile("SNA").timezone, "America/Los_Angeles");
    assert.equal(getAirportProfile("ATH").timezone, "Europe/Athens");
    assert.equal(getAirportProfile("DMM").timezone, "Asia/Riyadh");
  });
});
