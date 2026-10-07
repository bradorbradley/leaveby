# Leave By analytics: free-only, explicit events

This optional integration stays off until its production environment is explicitly configured. Project tokens and deployment credentials are not included in this repository. Existing Vercel pageviews stay in place. Custom events move to PostHog because Vercel custom events require Pro/Enterprise; do not upgrade Vercel for this work.

## Setup and free-only guardrails

1. Use an explicitly approved PostHog Cloud free project with Product Analytics only. If the free account cannot create another project, do not upgrade: reuse an existing project only with specific approval. Every event is tagged `application=leaveby` and `site=leaveby.xyz`; separate reports must filter both. This is report-level partitioning, not a security boundary, and existing data must be preserved. Do not add a card, enable a paid plan, subscribe to add-ons or start a paid trial. PostHog currently advertises 1 million product events/month free with no credit card. Recheck the project's billing and usage-limit behavior before enabling collection. The app's 200-event/tab-session ceiling prevents loops, not account-wide overage; only the provider's free-account/billing setup can guarantee no charge.
2. Obtain specific approval to enable project-wide **Discard client IP data** (`anonymize_ips=true`), then verify the saved setting. It affects new events from every app using that project; do not change it silently or claim this deletes historical IPs. Current docs establish the project setting as the reliable IP-storage control; `$ip: null` alone is not verified to do that. LeaveBy events additionally set `$geoip_disable: true` and `$process_person_profile: false`. The network provider necessarily sees the transport IP; do not claim that an IP is never received. This integration loads no PostHog SDK, does not fetch remote configuration and sends no recordings, autocapture, heatmaps, profiles, console logs or network payloads. Existing global replay/autocapture settings for other apps need not be changed.
3. Copy only the project's public write-only token (starts `phc_`) and its US/EU ingest region. No personal API key, OAuth grant, service account or secret is needed. Do not paste secrets into source control or chat. Any account creation, security/privacy change or persistent-access action still needs its appropriate authorization.
4. In the authorized deployment's **Production** environment set `NEXT_PUBLIC_POSTHOG_ENABLED=true`, `NEXT_PUBLIC_POSTHOG_TOKEN=<public project token>` and `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com` (or `https://eu.i.posthog.com`). Ensure `NEXT_PUBLIC_VERCEL_ENV=production` is exposed. The integration also checks `NODE_ENV=production` and the exact host `leaveby.xyz`/`www.leaveby.xyz`. It fails closed on localhost, previews, missing settings, unrecognized hosts and invalid tokens. Build-time `NEXT_PUBLIC_` settings require a new reviewed deployment.
5. `NEXT_PUBLIC_ANALYTICS_CAMPAIGNS=launch` is the default approved public campaign-code list. Add any intentional public campaign codes to this comma-separated allowlist before distributing their links. Do not put a person's name, email, location, itinerary, unique recipient code or free-form user input in it. Example: `https://www.leaveby.xyz/?utm_source=reddit&utm_medium=community&utm_campaign=launch`. Raw `utm_term`, `utm_content`, click IDs and unlisted URL values are never transmitted.
6. Review the privacy-policy changes, set its effective date to the actual rollout date, and authorize publishing before deployment. This is an engineering draft, not a legal assessment of jurisdiction-specific consent requirements. Keep collection disabled where additional consent is required until that flow is implemented.
7. After a separately authorized deployment, perform the acceptance check below. Do not call analytics live until real ingestion is verified in the intended project. To stop collection, set enabled to false and redeploy. A public ingestion token can be copied/spammed; the browser checks are data-hygiene controls, not authentication or bot protection.

Sources checked October 7, 2026:
- https://posthog.com/product-analytics/pricing
- https://posthog.com/docs/api/capture
- https://posthog.com/docs/data/anonymous-vs-identified-events
- https://posthog.com/docs/privacy/data-storage
- https://vercel.com/docs/analytics/custom-events
- https://vercel.com/docs/analytics/redacting-sensitive-data

## What is counted

All PostHog events have `application=leaveby`, `site=leaveby.xyz`, `schema_version=2`, `environment=production`, a random session/visit ID and a random event UUID. The ID is stored only in sessionStorage, renews after 30 minutes idle, has a 24-hour maximum, and survives same-tab navigation/reload. A closed/duplicated/restored tab can affect browser sessionStorage behavior. If sessionStorage is blocked, identity is in memory only. **These are anonymous tab visits, not unique people or verified travelers.** There is no cross-device, cross-tab or returning-person tracking.

| Event | Exact meaning |
| --- | --- |
| `visit_started` | First instrumented event in a tab visit. One per visit, including landing-only visitors. Not every pageview. |
| `planning_started` | At least one plan request launched in that visit. One per visit. It covers manual, auto-selected and scheduled flights; do not substitute `flight_picked`. |
| `plan_requested` | A new explicit generation (form submit, refresh or shared-link fallback). One random `attempt_id`; internal network retries retain it. |
| `plan_ready` | A generated plan actually mounted in Reveal with a valid leave time. One per generation. Shared hydration does not count. |
| `plan_shown` | A usable plan mounted, labeled `plan_source=generated` or `shared`, one per attempt/opening. Slider changes and effect reruns do not add counts. |
| `shared_plan_opened` | A shared payload was decoded/hydrated, without a new generation. |
| `flight_not_found`, `plan_error`, `plan_cancelled` | Terminal generation outcome. Errors contain only a fixed `timeout`/`error` label. Cancelling or replacing a running plan counts cancellation; starting over after completion does not. |
| `share_attempted` | A share or clipboard action was initiated. |
| `share_completed` | Browser share promise resolved, or clipboard write succeeded. This does not prove someone received/read the plan. |
| `share_cancelled`, `share_failed` | Browser cancellation (`AbortError`) versus another share/clipboard error. Error text is never sent. |
| `ride_tapped`, `route_tapped`, `reminder_tapped` | Intent click only. Not a booking, route completion or saved reminder. |
| `location`, `flight_options`, `flight_picked` | Allowlisted capability/outcome diagnostics; no location, flight number, airline or airport. `flight_picked` covers explicit choice only and is not a universal funnel step. |

The flow deliberately distinguishes completion from requests and generations from visits. Terminal errors/cancellations are captured from the current request, not inferred from React phase transitions. Stale responses are ignored. A result that arrived but was immediately superseded before Reveal mounted is not a shown plan.

## Dashboard recipe

Create these views in the intended free PostHog project after ingestion is verified. No dashboard is claimed to exist yet.

1. Ordered funnel: `visit_started` → `planning_started` → `plan_shown` filtered to `plan_source=generated`. Use the **unique users/distinct ID** aggregation with a 30-minute conversion window, and label the chart **Visit-to-generated-plan conversion (anonymous tab visits)**. Here distinct ID is a temporary visit ID, not a person. Filter every view to application leaveby + site leaveby.xyz + schema 2 + production. A longer conversion window can be used up to 24h; document it consistently.
2. Break that same funnel down by `source`, `medium` and `campaign`, which are first-touch labels fixed for the visit. Never join Vercel visitors to these IDs or divide PostHog completions by Vercel visitors as a conversion rate. Their definitions and collection coverage differ.
3. Generation outcome trends: count `plan_requested`, `plan_ready`, `flight_not_found`, `plan_error`, `plan_cancelled`; break requests down by `entry_point`. For exact generation conversion, match `attempt_id`/cohort and allow requests time to settle; dividing same-day completions by same-day starts is not a cohort conversion rate.
4. Shared-link consumption: unique visit IDs for `plan_shown` with `plan_source=shared`. Do not include shared plans as generated-plan conversions.
5. Intent events and share outcomes: show counts explicitly titled taps, attempts, browser-completed shares/clipboard copies. Do not label them purchases, reminders saved, recipients reached or successful trips.

Capture is best effort. Ad blockers, DNT/GPC, explicit opt-out, closed tabs, network failures and bots affect coverage. The client makes no automatic retry (which could duplicate an accepted event) and no claim of guaranteed delivery. Event UUIDs are supplied. No events are backfilled. No production counts or conversion result can be inferred from this draft.

## Privacy contract

- Fixed allowlists for event names, property keys and enum values; unknown keys/free text are dropped. Only public operator-allowlisted campaign codes survive; unknown campaign/source/medium become `other`.
- No raw URLs, query strings, fragments, referrer URLs, addresses, coordinates, flight/itinerary details, date/time inputs, request/response bodies, error messages or user-entered content go to PostHog.
- Existing Vercel pageview URLs are stripped to the known page path; unknown page paths are dropped. The global no-referrer policy also prevents a shared URL becoming the HTTP Referer on outgoing requests.
- PostHog requests omit credentials and the Referer header. No SDK, replay, DOM autocapture, identity/profile APIs or fingerprinting are used. No persistent visitor IDs or localStorage IDs.
- Session storage contains only ephemeral analytics IDs, allowlisted attribution and deduplication flags. DNT/GPC suppress both integrations' events. `localStorage.setItem("leaveby.analytics.optout", "1")` is also honored; this is a non-identifying opt-out flag, not a user ID.

## Acceptance check before calling it live

Use a test project or intercepted network for synthetic data, not the production metric stream. A production host/gating test needs explicit authorization; do not widen the committed hostname checks for convenience.

- Open a tagged landing link, navigate to `/app`, submit and show a plan: one visit, one planning start, one requested generation, one ready event, one generated shown event.
- Submit a second plan/refresh: same visit ID, a new attempt ID, no second planning start. A quiet network retry must retain the attempt ID.
- Complete a plan quickly (before a searching screen paints), change gate-buffer slider, rerender, cancel and restart, and navigate away/back. No duplicate shown generation; stale/cancelled responses cannot complete a newer one.
- Open a valid shared payload: shared shown event, no requested/ready generation. Refresh it: a real generation, entry point refresh. Invalid shared payload with valid fallback inputs: shared_fallback request.
- Test manual and auto-selected flights: both reach planning-started; flight_picked is not required.
- Cancel sharing, complete browser sharing, copy to clipboard, deny clipboard access: four appropriate outcomes. Maps, rides and reminders remain intent taps.
- Inspect request URL/body/headers with intentionally private synthetic query values: no query, payload, coordinates, flight details or full Referer in either integration's pageview/event payload. Verify provider project drops stored IP and doesn't enrich location.
- Verify DNT/GPC and opt-out suppress events. Local and preview deployments send no PostHog requests. Session expiry/reload behaves as documented.
- Confirm the intended PostHog project's live events receive data and dashboard filters/units match this document; verify billing still has no paid commitment.
