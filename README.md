# Leave By

One screen. Tell it your flight, where you're leaving from, whether you're checking a bag, and what skip-the-line perks you have. Pick how long you want at the gate. It does a live web search about that airport, that terminal, that hour, and tells you one time: when to walk out the door.

## How it works

1. **Resolve the flight.** Flight number + date → airport, terminal, scheduled local departure, domestic vs international. Scraped from FlightAware's public page first (fast, timezone-correct), with an OpenAI web-search fallback. If neither finds it, the app asks for the airport and departure time.
2. **Locate the traveler.** Address, zip, neighborhood, or "use my current location". Free geocoding (Photon / zippopotam) and a free-flow drive time from OSRM.
3. **Research the trip.** One OpenAI call (`gpt-5` with the `web_search` tool, streamed) runs 5 to 8 targeted searches: traffic on that route at that hour, construction at the airport, which checkpoint to use, whether PreCheck / CLEAR / Touchless ID are open then, bag-drop cutoff, boarding lead, anything unusual that day. It returns integer minutes for each leg plus short plain-English findings, validated against a strict JSON schema. The search queries stream to the loading screen as they happen.
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
| `OPENAI_RESEARCH_MODEL` | no | Default `gpt-5`. Must support the `web_search` tool. |
| `OPENAI_RESEARCH_EFFORT` | no | `low` (default), `medium`, or `high`. Higher is slower. |
| `OPENAI_FAST_MODEL` | no | Default `gpt-4.1`. Structured lookups. |

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
