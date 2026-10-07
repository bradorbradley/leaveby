import { campaignCodes, createAnalytics, productionConfig, type CaptureEvent, type EventName, type PlanEntry, type PlanTelemetry } from "@/lib/analytics";

let client: ReturnType<typeof createAnalytics> | undefined;

export function privacyOptOut(): boolean {
  if (typeof window === "undefined") return true;
  if (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return true;
  try { return localStorage.getItem("leaveby.analytics.optout") === "1"; } catch { return false; }
}

function getClient() {
  if (typeof window === "undefined" || privacyOptOut()) return undefined;
  const config = productionConfig({
    enabled: process.env.NEXT_PUBLIC_POSTHOG_ENABLED,
    token: process.env.NEXT_PUBLIC_POSTHOG_TOKEN,
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    deployEnvironment: process.env.NEXT_PUBLIC_VERCEL_ENV,
    nodeEnvironment: process.env.NODE_ENV,
  }, window.location.hostname);
  if (!config) return undefined;
  if (client) return client;
  let storage: Storage | undefined;
  try { storage = window.sessionStorage; } catch { /* Use memory only if storage is blocked. */ }
  client = createAnalytics({
    now: Date.now,
    uuid: () => crypto.randomUUID(),
    url: () => window.location.href,
    referrer: () => document.referrer,
    storage,
    campaigns: campaignCodes(process.env.NEXT_PUBLIC_ANALYTICS_CAMPAIGNS),
    send: (event: CaptureEvent) => {
      // No cookies, Referer, URL, user-agent property, auto-enrichment or SDK defaults.
      // The provider still sees the transport IP. Enable "Discard client IP data" in its project settings.
      void fetch(`${config.host}/i/v0/e/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: config.token, ...event }),
        credentials: "omit",
        referrerPolicy: "no-referrer",
        keepalive: true,
      }).catch(() => { /* Best effort, deliberately no retry/replay of potentially accepted events. */ });
    },
  });
  return client;
}

export function track(name: EventName, props?: Record<string, unknown>) {
  try { getClient()?.capture(name, props); } catch { /* Never interrupt the app. */ }
}

export function startPlanTracking(entry: PlanEntry): PlanTelemetry | null {
  try { return getClient()?.startPlan(entry) ?? null; } catch { return null; }
}
export function openSharedTracking(): PlanTelemetry | null {
  try { return getClient()?.openShared() ?? null; } catch { return null; }
}
export function showPlanTracking(telemetry: PlanTelemetry | null) {
  try { if (telemetry) getClient()?.showPlan(telemetry); } catch { /* Never interrupt the app. */ }
}
export function endPlanTracking(telemetry: PlanTelemetry | null, outcome: "flight_not_found" | "plan_error" | "plan_cancelled", reason?: "timeout" | "error") {
  try { if (telemetry) getClient()?.endPlan(telemetry, outcome, reason); } catch { /* Never interrupt the app. */ }
}
