# CMO log

Newest first. Every ~3 hours a scheduled check-in picks the next most useful step, ships it, and adds an entry here.

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
