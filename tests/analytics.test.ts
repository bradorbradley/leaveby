import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { attribution, campaignCodes, createAnalytics, eventProperties, productionConfig, sanitizedPageUrl, SESSION_MAX_MS, SESSION_STORAGE_KEY, SESSION_TIMEOUT_MS, type CaptureEvent } from "../lib/analytics";

function harness(options: { throws?: boolean } = {}) {
  const state = { now: 1_800_000_000_000, url: "https://www.leaveby.xyz/?utm_source=reddit&utm_medium=community&utm_campaign=launch", referrer: "https://reddit.com/r/travel?secret=private", data: new Map<string, string>() };
  const events: CaptureEvent[] = [];
  const storage = {
    getItem: (key: string) => { if (options.throws) throw new Error("storage blocked"); return state.data.get(key) ?? null; },
    setItem: (key: string, value: string) => { if (options.throws) throw new Error("storage blocked"); state.data.set(key, value); },
    removeItem: (key: string) => { state.data.delete(key); },
  };
  const runtime = { now: () => state.now, uuid: randomUUID, url: () => state.url, referrer: () => state.referrer, storage, send: (e: CaptureEvent) => events.push(e), campaigns: ["launch"] };
  return { state, events, runtime, analytics: createAnalytics(runtime) };
}

test("only fixed campaign labels survive private URL/query/referrer data", () => {
  const url = "https://www.leaveby.xyz/app?p=PRIVATE_PLAN&f=UA123&d=2026-10-07&o=HOME&lat=37.55&lon=-122.40&utm_source=reddit&utm_medium=community&utm_campaign=launch&utm_content=PRIVATE_EMAIL&utm_term=PRIVATE_PERSON#PRIVATE_FRAGMENT";
  assert.deepEqual(attribution(url, "https://evil.example/PRIVATE_REFERRER", ["launch"]), { source: "reddit", medium: "community", campaign: "launch", entry_page: "/app", entry_kind: "shared_link" });
  const unknown = attribution("https://www.leaveby.xyz/PRIVATE_PATH?utm_source=PRIVATE_PERSON&utm_medium=PRIVATE_EMAIL&utm_campaign=PRIVATE_HOME", "", ["launch"]);
  assert.deepEqual(unknown, { source: "other", medium: "other", campaign: "other", entry_page: "other", entry_kind: "standard" });
  assert.equal(attribution("https://www.leaveby.xyz/", "https://reddit.com.evil.example/private", []).source, "other");
  assert.equal(attribution("https://www.leaveby.xyz/", "https://old.reddit.com/r/a?q=private", []).source, "reddit");
  assert.equal(attribution("https://www.leaveby.xyz/", "https://www.leaveby.xyz/app?p=private", []).source, "direct");
  assert.deepEqual(campaignCodes("launch,my-public-post,bad@example.com,evil/x,invalid space"), ["launch", "my-public-post"]);
});

test("Vercel URL scrubber strips entire query/hash and drops unknown paths", () => {
  assert.equal(sanitizedPageUrl("https://www.leaveby.xyz/app?p=PRIVATE&lat=37&lon=-122#PRIVATE"), "https://www.leaveby.xyz/app");
  assert.equal(sanitizedPageUrl("https://www.leaveby.xyz/?utm_campaign=launch"), "https://www.leaveby.xyz/");
  assert.equal(sanitizedPageUrl("https://www.leaveby.xyz/PRIVATE_PERSON"), null);
  assert.equal(sanitizedPageUrl("not a url"), null);
});

test("property allowlist drops all trip details and arbitrary values", () => {
  const leak = { airport: "SFO", flight: "UA123", address: "PRIVATE", lat: 37.5, lon: -122.4, url: "https://leaveby.xyz/?p=PRIVATE", error: "PRIVATE", $current_url: "PRIVATE" };
  assert.deepEqual(eventProperties("plan_ready", leak), {});
  assert.deepEqual(eventProperties("plan_error", { ...leak, reason: "PRIVATE" }), {});
  assert.deepEqual(eventProperties("ride_tapped", { ...leak, app: "uber" }), { app: "uber" });
  assert.deepEqual(eventProperties("flight_options", { ...leak, status: "exact", count: 99 }), { status: "exact", count: 20 });
  assert.deepEqual(eventProperties("flight_options", { status: "PRIVATE", count: NaN }), {});
  assert.deepEqual(eventProperties("plan_requested", { entry_point: "form", attempt_id: "PRIVATE_PERSON" }), { entry_point: "form" });
});

test("production gating fails closed: disabled, absent/secret token, preview, local, wrong host or region", () => {
  const good = { enabled: "true", token: "phc_publicToken123456789", host: "https://us.i.posthog.com", deployEnvironment: "production", nodeEnvironment: "production" };
  assert.deepEqual(productionConfig(good, "www.leaveby.xyz"), { token: good.token, host: good.host });
  for (const change of [{ enabled: "false" }, { token: undefined }, { token: "phx_PERSONAL_SECRET" }, { host: "https://evil.example" }, { deployEnvironment: "preview" }, { nodeEnvironment: "development" }]) assert.equal(productionConfig({ ...good, ...change }, "www.leaveby.xyz"), null);
  for (const host of ["localhost", "leaveby-preview.vercel.app", "www.leaveby.xyz.evil.example"]) assert.equal(productionConfig(good, host), null);
  assert.ok(productionConfig({ ...good, host: "https://eu.i.posthog.com" }, "leaveby.xyz"));
});

test("visit funnel dedupes repeated effects, generations and gate-buffer rerenders honestly", () => {
  const { analytics: a, events } = harness();
  a.capture("visit_started");
  a.capture("visit_started");
  const first = a.startPlan("form")!;
  a.showPlan(first);
  a.showPlan(first);
  const second = a.startPlan("refresh")!;
  a.showPlan(second);
  a.showPlan(second);
  assert.notEqual(first.id, second.id);
  const count = (name: string) => events.filter((e) => e.event === name).length;
  assert.equal(count("visit_started"), 1);
  assert.equal(count("planning_started"), 1);
  assert.equal(count("plan_requested"), 2);
  assert.equal(count("plan_ready"), 2);
  assert.equal(count("plan_shown"), 2);
  assert.equal(new Set(events.map((e) => e.distinct_id)).size, 1);
  assert.equal(new Set(events.map((e) => e.uuid)).size, events.length);
  for (const event of events) {
    assert.equal(event.properties.$process_person_profile, false);
    assert.equal(event.properties.$geoip_disable, true);
    assert.equal(event.properties.$ip, null);
    assert.equal(event.properties.campaign, "launch");
    assert.equal(event.properties.environment, "production");
    assert.equal(event.properties.application, "leaveby");
    assert.equal(event.properties.site, "leaveby.xyz");
  }
});

test("a fast plan does not need an observable searching phase; shared plans never become generations", () => {
  const { analytics: a, events } = harness();
  const shared = a.openShared()!;
  a.showPlan(shared);
  a.showPlan(shared);
  assert.deepEqual(events.map((e) => e.event), ["visit_started", "shared_plan_opened", "plan_shown"]);
  assert.equal(events.at(-1)?.properties.plan_source, "shared");
  const plan = a.startPlan("shared_fallback")!;
  a.showPlan(plan);
  assert.equal(events.filter((e) => e.event === "plan_ready").length, 1);
  assert.equal(events.at(-1)?.properties.plan_source, "generated");
});

test("terminal outcomes dedupe across retries; cancellation is separate from a successful generation", () => {
  const { analytics: a, events } = harness();
  const first = a.startPlan("form")!;
  a.endPlan(first, "plan_error", "timeout");
  a.endPlan(first, "plan_error", "error");
  const second = a.startPlan("form")!;
  a.endPlan(second, "plan_cancelled");
  a.endPlan(second, "plan_cancelled");
  const third = a.startPlan("form")!;
  a.endPlan(third, "flight_not_found");
  assert.equal(events.filter((e) => e.event === "plan_error").length, 1);
  assert.equal(events.filter((e) => e.event === "plan_cancelled").length, 1);
  assert.equal(events.filter((e) => e.event === "flight_not_found").length, 1);
  assert.equal(events.filter((e) => e.event === "plan_ready").length, 0);
});

test("same-tab reload preserves visit and first-touch attribution; idle expiry starts a new visit", () => {
  const { analytics: a, events, runtime, state } = harness();
  a.capture("visit_started");
  const id = events[0].distinct_id;
  state.url = "https://www.leaveby.xyz/app?p=PRIVATE&f=UA123";
  state.now += 10_000;
  createAnalytics(runtime).capture("ride_tapped", { app: "lyft" });
  assert.equal(events.at(-1)?.distinct_id, id);
  assert.equal(events.at(-1)?.properties.campaign, "launch");
  assert.equal(events.filter((e) => e.event === "visit_started").length, 1);
  state.now += SESSION_TIMEOUT_MS;
  createAnalytics(runtime).capture("visit_started");
  assert.notEqual(events.at(-1)?.distinct_id, id);
  assert.equal(events.at(-1)?.properties.campaign, "none");
  assert.equal(events.filter((e) => e.event === "visit_started").length, 2);
});

test("session has a hard maximum even with regular activity", () => {
  const { analytics: a, events, state } = harness();
  a.capture("visit_started");
  const id = events[0].distinct_id;
  for (let i = 0; i < SESSION_MAX_MS / (10 * 60_000); i++) { state.now += 10 * 60_000; a.capture("ride_tapped", { app: "uber" }); }
  assert.notEqual(events.at(-1)?.distinct_id, id);
  assert.equal(events.filter((e) => e.event === "visit_started").length, 2);
});

test("storage failures fall back to memory; no user input leaks via tampered stored attribution", () => {
  const blocked = harness({ throws: true });
  blocked.analytics.capture("visit_started");
  blocked.analytics.capture("visit_started");
  assert.equal(blocked.events.length, 1);
  const h = harness();
  h.analytics.capture("visit_started");
  const saved = JSON.parse(h.state.data.get(SESSION_STORAGE_KEY)!);
  saved.attribution = { source: "PRIVATE", campaign: "PRIVATE", entry_page: "/PRIVATE", medium: "PRIVATE", entry_kind: "PRIVATE", extra: "PRIVATE" };
  h.state.data.set(SESSION_STORAGE_KEY, JSON.stringify(saved));
  createAnalytics(h.runtime).capture("reminder_tapped");
  assert.ok(!JSON.stringify(h.events.at(-1)).includes("PRIVATE"));
});

test("telemetry crypto or synchronous transport failures do not interrupt app flow", () => {
  const h = harness();
  const noCrypto = createAnalytics({ ...h.runtime, uuid: () => { throw new Error("no crypto"); } });
  assert.doesNotThrow(() => noCrypto.capture("visit_started"));
  assert.equal(noCrypto.startPlan("form"), null);
  assert.equal(noCrypto.openShared(), null);
  const noTransport = createAnalytics({ ...h.runtime, send: () => { throw new Error("failed"); } });
  assert.doesNotThrow(() => noTransport.capture("reminder_tapped"));
});

test("unexpected events are discarded and per-session ceiling stops runaway loops", () => {
  const { analytics: a, events } = harness();
  // @ts-expect-error exercise runtime defense against untyped callers
  a.capture("PRIVATE_FLIGHT");
  assert.equal(events.length, 0);
  for (let i = 0; i < 300; i++) a.capture("ride_tapped", { app: "uber" });
  assert.equal(events.length, 200);
});

test("integration boundaries keep source URL and private bodies out of the transport", () => {
  const transport = readFileSync(new URL("../lib/track.ts", import.meta.url), "utf8");
  assert.match(transport, /credentials: "omit"/);
  assert.match(transport, /referrerPolicy: "no-referrer"/);
  assert.match(transport, /navigator\.doNotTrack/);
  assert.match(transport, /globalPrivacyControl/);
  assert.doesNotMatch(transport, /posthog\.init|posthog\.identify|sendBeacon/);
  const home = readFileSync(new URL("../components/HomeClient.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(home, /prevPhase|track\("plan_ready"/);
  assert.match(home, /telemetry=\{state.telemetry\}/);
  const hook = readFileSync(new URL("../hooks/usePlan.ts", import.meta.url), "utf8");
  assert.ok(hook.indexOf("startPlanTracking(entry)") < hook.indexOf("for (let i = 0; i < RETRIES"));
  assert.match(hook, /abortRef\.current !== controller/);
  const reveal = readFileSync(new URL("../components/Reveal.tsx", import.meta.url), "utf8");
  assert.match(reveal, /showPlanTracking\(telemetry\)/);
  assert.match(reveal, /"reminder_tapped"/);
  assert.match(reveal, /"route_tapped"/);
  assert.doesNotMatch(reveal, /"reminder_added"|"plan_shared"|"route_opened"/);
});


test("old shown/ended tokens cannot reappear after session expiry or a buffer change", () => {
  const { analytics: a, events, state } = harness();
  const shown = a.startPlan("form")!;
  a.showPlan(shown);
  state.now += SESSION_TIMEOUT_MS + 1;
  a.showPlan(shown);
  a.endPlan(shown, "plan_cancelled");
  assert.equal(events.filter((e) => e.event === "visit_started").length, 1);
  assert.equal(events.filter((e) => e.event === "plan_ready").length, 1);
  assert.equal(events.filter((e) => e.event === "plan_cancelled").length, 0);
  const cancelled = a.startPlan("form")!;
  a.endPlan(cancelled, "plan_cancelled");
  state.now += SESSION_MAX_MS;
  a.endPlan(cancelled, "plan_error", "timeout");
  a.showPlan(cancelled);
  assert.equal(events.filter((e) => e.event === "plan_ready").length, 1);
  assert.equal(events.filter((e) => e.event === "plan_error").length, 0);
});

test("browser transport is exact, URL-free and suppresses DNT/GPC/opt-out without network", async () => {
  const names = ["window", "document", "navigator", "localStorage", "fetch"] as const;
  const descriptors = new Map(names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const env: Record<string, string | undefined> = process.env;
  const settings = { NEXT_PUBLIC_POSTHOG_ENABLED: "true", NEXT_PUBLIC_POSTHOG_TOKEN: "phc_publicTestToken123456", NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com", NEXT_PUBLIC_VERCEL_ENV: "production", NODE_ENV: "production" };
  const oldEnv = Object.fromEntries(Object.keys(settings).map((key) => [key, env[key]]));
  const storageData = new Map<string, string>();
  const storage = { getItem: (key: string) => storageData.get(key) ?? null, setItem: (key: string, value: string) => storageData.set(key, value), removeItem: (key: string) => storageData.delete(key) };
  const navigator = { doNotTrack: "0", globalPrivacyControl: false };
  const sent: Array<{ url: string; init: RequestInit }> = [];
  const replacements = {
    window: { location: { hostname: "www.leaveby.xyz", href: "https://www.leaveby.xyz/app?p=PRIVATE_PLAN&f=PRIVATE_FLIGHT&lat=37&lon=-122&utm_source=reddit&utm_campaign=launch" }, sessionStorage: storage },
    document: { referrer: "https://reddit.com/r/private?user=PRIVATE_PERSON" },
    navigator,
    localStorage: storage,
    fetch: async (url: string, init: RequestInit) => { sent.push({ url, init }); return new Response("{}", { status: 200 }); },
  };
  try {
    for (const name of names) Object.defineProperty(globalThis, name, { value: replacements[name], writable: true, configurable: true });
    Object.assign(env, settings);
    const adapter = await import("../lib/track");
    adapter.track("visit_started");
    const telemetry = adapter.startPlanTracking("form");
    adapter.showPlanTracking(telemetry);
    assert.equal(sent.length, 5);
    for (const request of sent) {
      assert.equal(request.url, "https://us.i.posthog.com/i/v0/e/");
      assert.equal(request.init.credentials, "omit");
      assert.equal(request.init.referrerPolicy, "no-referrer");
      assert.equal(request.init.method, "POST");
      const body = String(request.init.body);
      assert.doesNotMatch(body, /PRIVATE|"lat"|"lon"|referrer|current_url/);
      assert.equal(JSON.parse(body).properties.application, "leaveby");
    }
    navigator.doNotTrack = "1";
    adapter.track("reminder_tapped");
    navigator.doNotTrack = "0";
    navigator.globalPrivacyControl = true;
    adapter.track("reminder_tapped");
    navigator.globalPrivacyControl = false;
    storage.setItem("leaveby.analytics.optout", "1");
    adapter.track("reminder_tapped");
    assert.equal(sent.length, 5);
  } finally {
    for (const name of names) {
      const descriptor = descriptors.get(name);
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
    for (const [key, value] of Object.entries(oldEnv)) {
      if (value === undefined) delete env[key]; else env[key] = value;
    }
  }
});


test("TikTok and Threads keep known campaign sources without transmitting referrer URLs", () => {
  for (const source of ["tiktok", "threads"]) {
    assert.equal(attribution(`https://www.leaveby.xyz/?utm_source=${source}`, "", []).source, source);
  }
  for (const host of ["www.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"]) {
    assert.equal(attribution("https://www.leaveby.xyz/", `https://${host}/PRIVATE_VIDEO?q=PRIVATE`, []).source, "tiktok");
  }
  for (const host of ["threads.com", "l.threads.com", "www.threads.net"]) {
    assert.equal(attribution("https://www.leaveby.xyz/", `https://${host}/PRIVATE_POST?q=PRIVATE`, []).source, "threads");
  }
  assert.equal(attribution("https://www.leaveby.xyz/", "https://tiktok.com.evil.example/", []).source, "other");
});
