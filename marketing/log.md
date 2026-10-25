# CMO log

Newest first. Every ~3 hours a scheduled check-in picks the next most useful step, ships it, and adds an entry here.

## 2026-10-25 (10:00 check-in)
- **4 more guides abroad (now 48):** DUB, CUN, FCO and MAD.
  - DUB: US preclearance at Terminal 2. CBP lists its hours as 07:00–16:30 GMT. Delta advises 4 hours and closes check-in 75 minutes before departure.
  - CUN: which terminal each US airline uses. No paper FMM and no separate exit immigration.
  - FCO: e-gates for US passports, and the E-gate satellite.
  - MAD: the T4S train, then passport control.
- **Next:** Thanksgiving refresh when TSA publishes its forecast; PostHog when the key arrives.

## 2026-10-25 (07:00 check-in)
- **First guides abroad (now 44):** LHR, CDG, FRA and AMS, written for Americans flying home. Each has a "Passport control on the way out" section:
  - EES on exit at CDG, FRA and AMS, with reported waits.
  - The UK has no exit passport control.
  - AMS eGates for US passports.
  - FRA Terminal 3, open since April 23, 2026, now handles Delta and American.

  The template now supports `region: "intl"`, and `/airports` has a "Flying home to the US" section.
- **Next:** more international hubs (DUB with US preclearance, FCO, MAD, CUN); Thanksgiving refresh; PostHog when the key arrives.

## 2026-10-25 (04:00 check-in)
- **5 more airport guides (now 40):** MSY, SAT, IND, PIT and MCI, each with 15–21 sources. PIT covers the new terminal, open since Nov 18, 2025. Its busiest hours come from TSA's hourly screening counts (Sep 13–19, 2026). Recheck the SAT Terminal B curb work, which runs through December 2026.
- **Next:** IndexNow; Thanksgiving refresh when TSA publishes its forecast; PostHog when the key arrives.

## 2026-10-25 (01:00 check-in)
- **Product Hunt kit:** 5 gallery images (1270×760), built from real production screens (a live UA1564 DFW → ORD plan, the flight picker, the JFK guide, the international page) by `marketing/launch/gallery.mjs`. The launch-day checklist is in `marketing/launch/product-hunt.md`. Sent to the founder with the copy.
- **Next:** Thanksgiving refresh once TSA publishes its 2026 forecast; more guides; PostHog when the key arrives.

## 2026-10-24 (22:00 check-in)
- **Guide pages convert in one step:** every guide's call-to-action now has a flight-number box. Typing "DL 212" lands on `/app?flight=DL212` with the flight filled in and its departures already listed, so the visitor goes straight to picking theirs. It's a plain form, so it works without JavaScript. The query param is never sent to analytics (the page-URL allowlist strips queries). Tested end to end in a browser.
- **Next:** once PostHog is on, compare guide → plan conversion. Meanwhile: a Thanksgiving update with TSA's 2026 forecast when it's published (usually the week before), and the next guide batch.

## 2026-10-24 (19:00 check-in)
- **5 more airport guides (now 35):** PDX, SJC, HNL, STL and RDU, each with 16–23 sources. HNL covers the USDA agriculture inspection for flights to the mainland. For STL and RDU, which publish no peak times, the busiest hours come from TSA's hourly screening counts for Sep 13–19, 2026. I dropped one irrelevant item (the STL rental-car shuttle). Time-limited item to recheck: the STL Terminal 1 MetroLink closure, until about mid-December.
- **Next:** notify IndexNow; then improve conversion on guide pages (each guide's call-to-action could prefill the airport in the app); PostHog when the key arrives.

## 2026-10-24 (16:00 check-in)
- **Link previews per page:** each guide now has its own share card. `/airports/jfk` shows "How early should I get to JFK?", and the international, airport theory, Thanksgiving and airports index pages have their own too. `/api/og` only accepts a 3-letter airport code or a fixed page key, so nobody can render arbitrary text on our domain. Guide pages also gained Twitter large-image tags.
- **5 new airport guides (now 30):** BWI, TPA, AUS, BNA and MDW, each with 14–21 sources. I took out items that will go stale: AUS's Formula 1 weekend and TPA's resurfacing closure, which may already be over. Next time-limited item to recheck: MDW runway 22L, targeted to reopen mid-November.
- **Next:** notify IndexNow after deploy; PostHog when the key arrives; the next guide batch (PDX, STL, HNL, SJC, RDU).

## 2026-10-24 (afternoon)
- **Two new pages for big searches,** every fact cited:
  - `/international-flights`: airline cutoffs, no exit control leaving the US, EU Entry/Exit System waits, UK ETA, US preclearance, Global Entry.
  - `/airport-theory`: the TikTok trend versus bag and gate cutoffs, expert quotes, a real JFK plan.
  - Both have FAQPage schema, are in the sitemap and llms.txt, and are linked from home and `/airports`. Submit them to IndexNow after deploy.
- **Next:** a short-form post pack on the EES waits and airport theory; Bing Webmaster / Google Search Console once the founder adds them.

## 2026-10-24
- **Founder post pack:** 5 slideshows (an "I built this" post plus 4 of the best brand posts) sent to the founder to post on their own TikTok and Instagram. Source: `marketing/posts/founder.json`; render with `JPEG=1` for phone-sized files.
- **Technical SEO/AEO:**
  - `robots.txt` now allows `/api/og`, so X and Slack can fetch link-preview images.
  - Canonical URLs on `/` and `/app`; preview images on `/airports`.
  - The home page has a server-rendered Questions section with FAQPage and WebApplication JSON-LD, so crawlers that don't run JavaScript can read it (82 → 316 words).
- **IndexNow:** key file plus `scripts/indexnow.mjs`. After each deploy that adds pages, run it to notify Bing (which ChatGPT search and Copilot use).
- **Next:** new guide pages for "how early for an international flight" and "airport theory"; turn on PostHog once the founder sends the `phc_` key; Google Search Console once the founder adds the site.
