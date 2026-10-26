# CMO log

Newest first. Every ~3 hours a scheduled check-in picks the next most useful step, ships it, and adds an entry here.

## 2026-10-26 (16:00 check-in)
- **5 more guides (now 67):**
  - MKE: Concourses C and D have separate checkpoints, not connected airside; Concourse E rebuild.
  - CHS: one checkpoint, 3:30am–9:30pm; Touchless ID since March 2026; no CLEAR.
  - OGG: USDA inspection for flights to the mainland; 50-minute inter-island bag cutoff.
  - BUR: the new terminal opened Oct 13, 2026 (confirmed by ABC7 and Airways), with one checkpoint and a new entrance at Winona Ave & Hollywood Way.
  - ONT: Terminals 2 and 4 are not connected airside.
  - Busiest hours come from TSA's Sep 13–19 counts, checked against annual traffic. BUR's counts predate the new terminal, and the guide says so. OGG's airside connection was only inferred, so I left it as unknown.
- **Next:** refresh holiday pages when the 2026 forecasts publish; PostHog when the key arrives.

## 2026-10-26 (13:00 check-in)
- **Product fix: DJT.** Palm Beach International is now President Donald J. Trump International Airport, and its IATA code changed from PBI to DJT on Aug 18, 2026 (flydjt.org). Our airport table predates that, so a hand-entered DJT departure was rejected and the airport had no coordinates for the drive. DJT now maps to PBI's row (test added), and `/airports/pbi` redirects permanently to `/airports/djt`.
- **2 more guides (now 59):**
  - DJT: concourses A/B and C are not connected airside; CLEAR and PreCheck at both checkpoints; the winter peak is about 2x September.
  - JAX: one checkpoint for Concourses A and C; new Concourse B due Jan 2027; no CLEAR. I removed a near-live "garage partly closed" note.
- **3 more guides (now 62):**
  - CMH: three concourses, each with its own checkpoint; the CMH Next terminal is due in 2029, and the Walking Lot closed May 2026.
  - CVG: one checkpoint, then a tunnel and trains to Concourses A and B; Delta's 45-minute check-in rule at CVG.
  - BDL: two checkpoints; its new concourse opened Jan 2026.
- **Internal links:** every US airport guide now links to `/tsa-busiest-times` and `/busiest-travel-days`.
- **Next:** CMH, CVG, BDL; refresh holiday pages when the 2026 forecasts publish; PostHog when the key arrives.

## 2026-10-26 (10:00 check-in)
- **Press kit for the pre-Thanksgiving news cycle.** Distribution is the bottleneck: the post packs are still waiting on the founder. Reporters write "busiest travel days" stories every November and need data and charts, which we have.
  - Four chart images with titles and TSA sources, free to use with credit: `/press/tsa-by-hour.png`, `/press/tsa-day-by-hour.png`, `/press/tsa-by-weekday.png`, `/press/tsa-2025-calendar.png`. Both data pages now link to them.
  - `marketing/outreach/press-pitch.md`: the email, subject lines and a facts table, for the founder to send Nov 2–13.
  - `marketing/outreach/outlets.md`: 20 outlets (The Points Guy, NBC/TODAY, ABC News, Simple Flying, plus 16 local TV stations in 9 airport metros), each with a public tip channel printed on the outlet's own site. No personal reporter contacts. Axios, CNBC, T+L, CN Traveler and USA Today block automated checks, so check those by hand.
- **Next:** founder sends the pitch; a post from the hourly findings; refresh holiday pages when the 2026 forecasts publish; PostHog when the key arrives.

## 2026-10-26 (07:00 check-in)
- **New data page: `/tsa-busiest-times`** ("What time of day is TSA busiest?"). I summed TSA's hourly counts for every checkpoint in the US over Sep 13–19, 2026 (168 hours, 16.6M screenings) from the FOIA throughput PDF. Daily totals match TSA's published national numbers within 1.2%, and a test checks this.
  - Findings: 5–7am local is the peak on every day of the week and carries 15% of screenings; 34% happen before 9am, and only 7% after 7pm. Sundays stay busy from early morning into late afternoon.
  - Hour-of-day bar chart and a day × hour heatmap, using the same validated coral ramp. FAQ schema, og card, linked from home and `/busiest-travel-days`.
  - Not done: a per-airport peak-hour table. My quick per-airport split didn't match the agents' checkpoint-matched totals (SMF 83K vs 133K), so I left it out rather than publish wrong numbers.
- **Next:** a post from these findings; refresh holiday pages when the 2026 forecasts publish; PostHog when the key arrives.

## 2026-10-26 (04:00 check-in)
- **5 more airport guides (now 57):** SMF, OAK, SNA, RSW and CLE, with 17–27 sources each.
  - Busiest hours come from TSA's hourly counts for Sep 13–19, 2026, since none of the five publishes peak times.
  - SMF: the terminals aren't connected after security.
  - OAK: BART start times; CLEAR is in Terminal 2 only.
  - SNA: the 10pm–7am departure curfew (8am Sunday), checked against Newport Beach city documents; CLEAR is only at Terminal B.
  - RSW: three concourses not connected airside, a temporary Concourse C checkpoint, and the winter peak (1.52M passengers in March vs 0.55M in September).
  - CLE: checkpoint hours, the expanded Central checkpoint with Touchless ID, and the RTA Red Line.
  - Removed two items that would go stale: RSW's proposed parking rates, which I couldn't confirm were approved, and CLE's live "lot full" status. Nearby links work (OAK → SFO, SJC). No production runtime errors in 48h.
- **Next:** more data content (TSA hourly by airport could make a "best time of day to fly" page); refresh holiday pages when the 2026 forecasts publish; PostHog when the key arrives.

## 2026-10-26 (01:00 check-in)
- **Data-drop post pack (4 posts, 2 concepts x 2 hooks)** from TSA's daily numbers, the same data as `/busiest-travel-days`:
  - `three-million`: only 8 days in history topped 3M, every one a Friday or Sunday. The record is 3,134,613 on the Sunday after Thanksgiving, and this year that Sunday is Nov 29.
  - `quiet-days`: Tuesday averages 21% fewer people than Sunday, and the holidays themselves are quiet, with the reminder that cutoffs don't move.
  - Every number is from the dataset or a cited page. One caption was moved off the mascot's face. Spec: `marketing/posts/data-drop.json`. Queued as "post before Thanksgiving" in `queue.md`. Zip sent to the founder.
- **Next:** more guides or the next data page; refresh holiday pages when the 2026 forecasts publish; PostHog when the key arrives.

## 2026-10-25 (22:00 check-in)
- **New data page: `/busiest-travel-days`**, built from every day of TSA checkpoint numbers since Jan 1, 2025 (660 days, stored in `lib/tsa-volumes.json`, 16 values spot-checked against TSA's tables). It has a heatmap calendar for each year, the top 10 days on record, a busiest-weekday chart, the quietest days and 2026 vs 2025. FAQ and Dataset schema, its own share card, and links from home, Thanksgiving and holidays.
  - Findings: the record is 3,134,613 (Sun Nov 30, 2025). Only 8 days ever topped 3M, all in 2025 and all on a Friday or Sunday. Sunday is the busiest day of the week and Tuesday the quietest (about 21% lower). 2026 is running 0.8% below 2025, and no 2026 day has reached 3M.
  - Why: "busiest travel days" and "busiest day to fly" are big, evergreen searches, and original charted data is what reporters and bloggers link to.
  - To update: TSA blocks curl (403), so fetch the table with WebFetch and append to `counts`. The tests pin known dates.
- **Next:** a post pack from these findings ("Only 8 days ever hit 3 million"); refresh holiday pages when the 2026 forecasts publish; PostHog when the key arrives.

## 2026-10-25 (19:00 check-in)
- **New page: `/holiday-travel-2026`** (Christmas and New Year's). People plan holiday trips weeks ahead, so publishing now gives search engines time to rank it before the rush. Every number is cited (TSA daily checkpoint counts, the TSA, AAA and Airlines for America 2025 forecasts, BTS December delays, TSA ConfirmID, the Newark flight limits). The 2026 busy days are clearly labeled as last season's pattern mapped onto this year's calendar, not a forecast. It has its own share card and FAQ schema, and is linked from home, Thanksgiving and airport theory.
- **Fixed:** the Thanksgiving page now says "about 3.13 million" for TSA's record day. TSA's own table shows 3,134,613, but news outlets reported 3,133,924.
- **Next:** refresh both holiday pages when the 2026 TSA and AAA forecasts come out (mid-Nov and mid-Dec); PostHog when the key arrives.

## 2026-10-25 (16:00 check-in)
- **4 more guides (now 52):**
  - YYZ: US preclearance; which US airlines use T1 vs T3; CBP hours are 3:30am–9pm.
  - YVR: US preclearance at Pier E, open 4:30am–midnight.
  - SJD: all US airlines use T2.
  - SJU: US guide. USDA inspects every bag going to the mainland; no passport needed, but adults need REAL ID; TSA hourly peaks.
  - Neither yvr.ca nor aeropuertosju.com would load, so those two guides rely on airline, government and news sources.
- **Next:** Thanksgiving refresh when TSA publishes its forecast; PostHog when the key arrives.

## 2026-10-25 (13:00 check-in)
- **Nearby-airport links:** each guide now links up to 3 other guided airports within 120 km, nearest first, with the distance in miles. Examples: JFK → LGA, EWR; ORD → MDW; DCA → IAD, BWI; SFO → SJC. This helps people comparing airports in one metro, and gives search engines a clearer map of related pages. Unit test added.
- **Next:** Thanksgiving refresh when TSA publishes its forecast; PostHog when the key arrives.

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
