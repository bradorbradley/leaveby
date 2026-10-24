# CMO log

Newest first. Every ~3 hours a scheduled check-in picks the next most useful step, ships it, and adds an entry here.

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
