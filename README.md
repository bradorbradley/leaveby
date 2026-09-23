# Leave By

One screen. Tell it your flight, where you're leaving from, whether you're checking a bag, and what skip-the-line perks you have. Pick how long you want at the gate. It does a live web search about that airport, that terminal, that hour, and tells you one time: when to walk out the door.

## How it works

1. **Resolve the flight.** Flight number + date → airport, terminal, scheduled local departure, domestic vs international. Scraped from FlightAware's public page first (fast, timezone-correct), with an OpenAI web-search fallback. If neither finds it, the app asks for the airport and departure time.
2. **Locate the traveler.** Address, zip, neighborhood, or "use my current location". Free geocoding (Photon / zippopotam) and a free-flow drive time from OSRM.
3. **Research the trip.** Four focused web searches run in parallel, one model call each (`gpt-4.1` with the `web_search` tool): traffic and roads on that route at that hour, the checkpoint and lanes at that terminal, the airline's bag-drop and boarding rules plus the walks inside, and anything unusual that day. A quick synthesis call turns the four notes into integer minutes per leg and short plain-English findings, validated against a strict JSON schema. Each step has its own timeout, so the whole thing takes about 10 seconds and can never hang. Airport-level findings are cached for a few hours per server instance.
4. **Do the math.** Subtract backwards from departure: boarding lead → gate time → walk → security → curb/bag drop → drive. A checked bag adds a second constraint (the airline's bag-drop cutoff); the earlier of the two wins. Rounded down to a 5-minute mark. The gate-time slider recomputes instantly on the client.
5. **Reveal.** The time, big. Uber / Lyft / Maps deep links to the terminal. The receipt (a stacked bar and a timeline), then only the findings that changed the number.

If the OpenAI key is missing or the search fails, the app still answers using typical numbers for that airport and says so.

Profile (perks, home, recent origins, preferred gate time) is saved in the browser. No accounts.

## Run it

```bash
npm install
cp .env.example .env.local   # add your OpenAI key
npm run dev
```

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | yes | Used for the research step and the flight fallback. |
| `OPENAI_FAST_MODEL` | no | Default `gpt-4.1`. Used for flight lookups, the four research scouts, and synthesis. |
| `OPENAI_SCOUT_MODEL` | no | Override the scout model. Must support the `web_search` tool. |
| `OPENAI_SYNTH_MODEL` | no | Override the synthesis model. |
| `RESEARCH_SCOUT_TIMEOUT_MS` | no | Default 14000. |
| `RESEARCH_SYNTH_TIMEOUT_MS` | no | Default 18000. |

## Code map

- `app/page.tsx` — the one screen: plan → searching → reveal.
- `app/api/plan/route.ts` — NDJSON stream of progress events, then the result.
- `app/api/places/route.ts` — address suggestions and reverse geocoding.
- `lib/resolve-flight.ts` — flight number → flight facts.
- `lib/route.ts` — origin → coordinates → free-flow drive time.
- `lib/research.ts` — the prompt, the schema, the streaming, the fallback.
- `lib/plan-math.ts` — the subtraction. Pure, shared by server and client.
- `lib/profile.ts` — what's remembered on the phone.
- `lib/ride-links.ts` — Uber, Lyft, Google Maps, Google Calendar links.
