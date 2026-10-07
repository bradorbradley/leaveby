/** Deliberately small, explicit event contract. No SDK, DOM capture, URL capture or profiles. */
export const ANALYTICS_SCHEMA = 2;
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
export const SESSION_MAX_MS = 24 * 60 * 60 * 1000;
export const SESSION_STORAGE_KEY = "leaveby.analytics.v2";

const SOURCES = ["google", "bing", "x", "twitter", "linkedin", "reddit", "hackernews", "producthunt", "facebook", "instagram", "tiktok", "threads", "newsletter", "email"] as const;
const MEDIUMS = ["social", "organic", "referral", "email", "cpc", "paid_social", "community"] as const;
const PAGES = ["/", "/app", "/privacy", "/terms"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CAMPAIGN_CODE = /^[a-z][a-z0-9_-]{0,39}$/;

type Value = string | number | boolean | null;
export type Properties = Record<string, Value>;
export type PlanEntry = "form" | "refresh" | "shared_fallback";
export type PlanTelemetry = { id: string; source: "generated" | "shared" };
export type EventName = "visit_started" | "planning_started" | "plan_requested" | "plan_ready" | "plan_shown" | "shared_plan_opened" | "flight_not_found" | "plan_error" | "plan_cancelled" | "location" | "flight_options" | "flight_picked" | "share_attempted" | "share_completed" | "share_failed" | "share_cancelled" | "ride_tapped" | "route_tapped" | "reminder_tapped";

export interface Attribution {
  source: string;
  medium: string;
  campaign: string;
  entry_page: string;
  entry_kind: "shared_link" | "standard";
}

function pick(value: unknown, choices: readonly string[], fallback = "other"): string {
  return typeof value === "string" && choices.includes(value) ? value : fallback;
}

/** Accept only operator-approved public campaign codes. Never arbitrary URL values. */
export function campaignCodes(value = "launch"): string[] {
  return value.split(",").map((v) => v.trim()).filter((v) => CAMPAIGN_CODE.test(v)).slice(0, 50);
}

function referralSource(referrer: string): string {
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    const domains: Array<[string, string]> = [["google.com", "google"], ["bing.com", "bing"], ["t.co", "x"], ["x.com", "x"], ["twitter.com", "x"], ["linkedin.com", "linkedin"], ["reddit.com", "reddit"], ["news.ycombinator.com", "hackernews"], ["producthunt.com", "producthunt"], ["facebook.com", "facebook"], ["instagram.com", "instagram"], ["tiktok.com", "tiktok"], ["threads.com", "threads"], ["threads.net", "threads"]];
    if (host === "leaveby.xyz" || host === "www.leaveby.xyz") return "direct";
    return domains.find(([domain]) => host === domain || host.endsWith(`.${domain}`))?.[1] ?? "other";
  } catch {
    return "direct";
  }
}

export function attribution(url: string, referrer: string, campaigns: readonly string[]): Attribution {
  const parsed = new URL(url);
  const query = parsed.searchParams;
  const source = query.has("utm_source") ? pick(query.get("utm_source")?.toLowerCase(), SOURCES) : referralSource(referrer);
  return {
    source: source === "twitter" ? "x" : source,
    medium: query.has("utm_medium") ? pick(query.get("utm_medium")?.toLowerCase(), MEDIUMS) : "unspecified",
    campaign: query.has("utm_campaign") ? pick(query.get("utm_campaign"), campaigns) : "none",
    entry_page: pick(parsed.pathname, PAGES),
    entry_kind: ["p", "f"].some((key) => query.has(key)) ? "shared_link" : "standard",
  };
}

/** Vercel still counts pageviews; strip ALL query/hash data before collection. */
export function sanitizedPageUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!PAGES.includes(parsed.pathname as typeof PAGES[number])) return null;
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return null;
  }
}

/** Defense in depth: unexpected keys, free text and invalid enum values are discarded. */
export function eventProperties(name: EventName, input: Record<string, unknown> = {}): Properties {
  const output: Properties = {};
  const enumProp = (key: string, values: readonly string[]) => {
    if (typeof input[key] === "string" && values.includes(input[key])) output[key] = input[key];
  };
  const id = () => { if (typeof input.attempt_id === "string" && UUID.test(input.attempt_id)) output.attempt_id = input.attempt_id; };
  switch (name) {
    case "planning_started":
    case "plan_requested":
      enumProp("entry_point", ["form", "refresh", "shared_fallback"]);
      if (name === "plan_requested") id();
      break;
    case "plan_shown":
      enumProp("plan_source", ["generated", "shared"]);
      id();
      break;
    case "plan_ready":
    case "flight_not_found":
    case "plan_cancelled":
      id();
      break;
    case "plan_error":
      id();
      enumProp("reason", ["timeout", "error"]);
      break;
    case "location": enumProp("result", ["unsupported", "denied", "no_fix", "ok"]); break;
    case "flight_options":
      enumProp("status", ["exact", "typical", "not_operating", "not_found", "unavailable", "failed"]);
      if (typeof input.count === "number" && Number.isInteger(input.count) && input.count >= 0) output.count = Math.min(input.count, 20);
      break;
    case "flight_picked":
      if (typeof input.exact === "boolean") output.exact = input.exact;
      if (typeof input.choices === "number" && Number.isInteger(input.choices) && input.choices >= 0) output.choices = Math.min(input.choices, 20);
      break;
    case "share_attempted":
    case "share_completed":
    case "share_failed":
    case "share_cancelled": enumProp("method", ["native", "clipboard"]); break;
    case "ride_tapped": enumProp("app", ["uber", "lyft"]); break;
    case "route_tapped": enumProp("app", ["google", "apple"]); break;
  }
  return output;
}

const EVENTS: readonly EventName[] = ["visit_started", "planning_started", "plan_requested", "plan_ready", "plan_shown", "shared_plan_opened", "flight_not_found", "plan_error", "plan_cancelled", "location", "flight_options", "flight_picked", "share_attempted", "share_completed", "share_failed", "share_cancelled", "ride_tapped", "route_tapped", "reminder_tapped"];

interface Session {
  id: string;
  started: number;
  updated: number;
  attribution: Attribution;
  seen: string[];
  count: number;
}

export interface CaptureEvent {
  event: EventName;
  distinct_id: string;
  uuid: string;
  timestamp: string;
  properties: Properties & { $process_person_profile: false; $geoip_disable: true; $ip: null };
}

interface Runtime {
  now: () => number;
  uuid: () => string;
  url: () => string;
  referrer: () => string;
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  send: (event: CaptureEvent) => void;
  campaigns: readonly string[];
}

/** A tab visit, not a person. Renew after 30 minutes idle (24-hour maximum). */
export function createAnalytics(runtime: Runtime) {
  let memory: Session | undefined;
  // React keeps this token for a result. Its lifecycle outlives an analytics session.
  const completed = new WeakSet<PlanTelemetry>();
  const save = (session: Session) => {
    memory = session;
    try { runtime.storage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session)); } catch { /* In-memory fallback, no cookies/localStorage. */ }
  };
  const getSession = (): Session => {
    const now = runtime.now();
    let saved: Session | undefined = memory;
    if (!saved) {
      try {
        const parsed = JSON.parse(runtime.storage?.getItem(SESSION_STORAGE_KEY) ?? "null") as Session | null;
        // Rebuild the persisted attribution from allowlisted values, never spread storage into a request.
        if (parsed && UUID.test(parsed.id) && Number.isFinite(parsed.started) && Number.isFinite(parsed.updated) && Array.isArray(parsed.seen)) {
          const a = parsed.attribution;
          saved = {
            id: parsed.id, started: parsed.started, updated: parsed.updated,
            count: Number.isSafeInteger(parsed.count) && parsed.count >= 0 ? parsed.count : 0,
            seen: parsed.seen.filter((key): key is string => typeof key === "string" && key.length <= 80).slice(-200),
            attribution: {
              source: pick(a?.source, [...SOURCES, "direct"]), medium: pick(a?.medium, [...MEDIUMS, "unspecified"]),
              campaign: pick(a?.campaign, [...runtime.campaigns, "none"]), entry_page: pick(a?.entry_page, PAGES),
              entry_kind: a?.entry_kind === "shared_link" ? "shared_link" : "standard",
            },
          };
        }
      } catch { /* Invalid/unavailable storage starts a fresh anonymous visit. */ }
    }
    if (!saved || now < saved.updated || now - saved.updated >= SESSION_TIMEOUT_MS || now - saved.started >= SESSION_MAX_MS) {
      saved = { id: runtime.uuid(), started: now, updated: now, attribution: attribution(runtime.url(), runtime.referrer(), runtime.campaigns), seen: [], count: 0 };
    }
    saved.updated = now;
    save(saved);
    return saved;
  };
  const emit = (session: Session, name: EventName, props: Properties, once?: string) => {
    if (once && session.seen.includes(once)) return;
    // Per-tab ceiling limits accidental loops. Free-only account setup remains the global cost control.
    if (session.count >= 200) return;
    if (once) session.seen.push(once);
    session.count += 1;
    save(session);
    runtime.send({
      event: name, distinct_id: session.id, uuid: runtime.uuid(), timestamp: new Date(runtime.now()).toISOString(),
      properties: { ...session.attribution, ...props, schema_version: ANALYTICS_SCHEMA, application: "leaveby", site: "leaveby.xyz", environment: "production", $session_id: session.id, $process_person_profile: false, $geoip_disable: true, $ip: null },
    });
  };
  const capture = (name: EventName, props: Record<string, unknown> = {}, once?: string) => {
    if (!EVENTS.includes(name)) return;
    try {
      const session = getSession();
      emit(session, "visit_started", {}, "visit_started");
      if (name !== "visit_started") emit(session, name, eventProperties(name, props), once);
    } catch { /* Analytics must never interrupt the app, including storage/crypto/transport failures. */ }
  };
  return {
    capture,
    startPlan(entry: PlanEntry): PlanTelemetry | null {
      try {
        const telemetry: PlanTelemetry = { id: runtime.uuid(), source: "generated" };
        capture("planning_started", { entry_point: entry }, "planning_started");
        capture("plan_requested", { attempt_id: telemetry.id, entry_point: entry }, `requested:${telemetry.id}`);
        return telemetry;
      } catch { return null; }
    },
    openShared(): PlanTelemetry | null {
      try {
        const telemetry: PlanTelemetry = { id: runtime.uuid(), source: "shared" };
        capture("shared_plan_opened");
        return telemetry;
      } catch { return null; }
    },
    showPlan(telemetry: PlanTelemetry) {
      if (completed.has(telemetry)) return;
      completed.add(telemetry);
      if (telemetry.source === "generated") capture("plan_ready", { attempt_id: telemetry.id }, `ready:${telemetry.id}`);
      capture("plan_shown", { attempt_id: telemetry.id, plan_source: telemetry.source }, `shown:${telemetry.id}`);
    },
    endPlan(telemetry: PlanTelemetry, outcome: "flight_not_found" | "plan_error" | "plan_cancelled", reason?: "timeout" | "error") {
      if (completed.has(telemetry)) return;
      completed.add(telemetry);
      capture(outcome, { attempt_id: telemetry.id, reason }, `ended:${telemetry.id}`);
    },
  };
}

export interface AnalyticsConfig { enabled?: string; token?: string; host?: string; deployEnvironment?: string; nodeEnvironment?: string }
export function productionConfig(config: AnalyticsConfig, hostname: string) {
  const host = config.host ?? "https://us.i.posthog.com";
  if (config.enabled !== "true" || config.nodeEnvironment !== "production" || config.deployEnvironment !== "production") return null;
  if (!["leaveby.xyz", "www.leaveby.xyz"].includes(hostname)) return null;
  if (!["https://us.i.posthog.com", "https://eu.i.posthog.com"].includes(host)) return null;
  // Public project ingestion token only. Reject personal API keys and unconfigured placeholders.
  if (!config.token || !/^phc_[a-zA-Z0-9]{10,}$/.test(config.token)) return null;
  return { token: config.token, host };
}
