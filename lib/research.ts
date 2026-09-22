import { getAirportProfile, getTerminalProfile } from "@/lib/airports";
import { RESEARCH_MODEL, hasOpenAI, openai } from "@/lib/openai";
import { instantToZonedParts } from "@/lib/tz";
import type { FlightInfo } from "@/types/flight";
import type { Perks, Research, RouteEstimate } from "@/types/plan";
import type { WeatherEstimate } from "@/types/weather";

export interface ResearchInput {
  flight: FlightInfo;
  route: RouteEstimate;
  weather: WeatherEstimate | null;
  checkedBag: boolean;
  perks: Perks;
  onSearch?: (query: string) => void;
  onNote?: (text: string) => void;
}

const SYSTEM = `You are the brain behind Leave By, an app that answers one question for one traveler: "What time do I need to walk out the door to make my flight?"

You have web search. Use it. Your job is the fresh, specific search a well-traveled friend would do for them right now: not a formula, not generic advice. Everything must be about THIS airport, THIS terminal, THIS hour, THIS day of week, and THIS traveler's lanes.

Run 5 to 8 targeted searches, then answer. Batch related questions into one query where you can. Do not keep searching once you have a defensible number for each field; a good answer in 30 seconds beats a perfect one in three minutes. Good queries look like: "JFK Terminal 4 TSA PreCheck hours", "JFK Terminal 4 CLEAR open", "Van Wyck construction JFK this week", "Delta bag drop cutoff JFK", "JFK Terminal 4 security wait Thursday morning", "JFK Terminal 4 checkpoint which is shorter".

Judgment: err a little protective (a missed flight costs hours, ten spare minutes cost nothing) but do not pad every number; travelers stop trusting an app that always says four hours. Where live data is thin, use the airport's known pattern and say so in sources.

Writing: every sentence you return is shown on a phone to someone who is not a frequent flyer. Plain words, no jargon, no hedging, at most 18 words per sentence. Name the specific thing (the checkpoint, the road, the rule).`;

export async function researchTrip(input: ResearchInput): Promise<Research> {
  if (!hasOpenAI()) return fallbackResearch(input, "No OpenAI key configured");
  try {
    const result = await runOpenAIResearch(input);
    if (result) return result;
    return fallbackResearch(input, "Research returned nothing usable");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fallbackResearch(input, message);
  }
}

function describeLanes(perks: Perks): string {
  const lanes = [
    perks.precheck && "TSA PreCheck",
    perks.globalEntry && "Global Entry (which includes TSA PreCheck)",
    perks.clear && "CLEAR",
    perks.touchlessId && "TSA PreCheck Touchless ID / airline Digital ID",
  ].filter(Boolean);
  return lanes.length ? lanes.join(", ") : "none; standard screening only";
}

async function runOpenAIResearch(input: ResearchInput): Promise<Research | null> {
  const { flight, route, weather, checkedBag, perks } = input;
  const tz = flight.departureTimezone ?? "America/New_York";
  const dep = new Date(flight.departureTime);
  const depParts = instantToZonedParts(dep, tz);
  const nowParts = instantToZonedParts(new Date(), tz);
  const arrivalGuess = instantToZonedParts(new Date(dep.getTime() - 2 * 3600 * 1000), tz);

  const originLine = route.originLabel
    ? `${route.originLabel}${route.freeFlowMinutes ? ` (routing engine says ${route.freeFlowMinutes} min with no traffic, ${route.distanceKm ?? "?"} km)` : " (routing engine could not compute a drive time; estimate it)"}`
    : "not given. Assume a typical trip from within the metro area and say so in the traffic sentence.";

  const user = `## The trip
- Flight ${flight.flightNumber} (${flight.airlineName}) on ${depParts.weekday} ${depParts.isoDate}, departing ${flight.departureAirport}${flight.departureAirportName ? ` (${flight.departureAirportName})` : ""} at ${depParts.hhmm} local, to ${flight.destinationCity ?? flight.destinationAirportCode ?? "unknown"}.
- Route type: ${flight.region}. Status: ${flight.status}${flight.delayMinutes > 0 ? ` (currently ${flight.delayMinutes} min late)` : ""}.
- Terminal: ${flight.terminal ? `Terminal ${flight.terminal}` : "not published; find which terminal this airline uses at this airport"}.
- They will probably be at the airport around ${arrivalGuess.hhmm} local on a ${depParts.weekday}.
- Right now it is ${nowParts.weekday} ${nowParts.isoDate} ${nowParts.hhmm} at the airport.
- Leaving from: ${originLine}
- Getting there by car or rideshare, dropped at the departures curb.
- Checked bag: ${checkedBag ? "YES" : "no, carry-on only, mobile boarding pass"}.
- Skip-the-line: ${describeLanes(perks)}.
- Weather forecast near departure: ${weather ? `${weather.summary}${weather.notes.length ? ` ${weather.notes.join(" ")}` : ""}` : "unknown"}.
- The traveler separately chooses how long they want at the gate. Do NOT include gate time in your numbers.

## Go find, in this order
1. FLIGHT REALITY. Confirm the terminal and departure time for this date. Airlines move terminals; catch that.
2. GETTING THERE. Realistic drive time from the origin to that terminal's departures curb at the hour they would be driving, with typical traffic for that day of week. Named chokepoints. Active roadway, curb, or parking construction at the airport this month. Where rideshares actually drop off at this terminal if not the curb.
3. THE CHECKPOINT. Which checkpoints this terminal has and which is usually shorter. Typical wait at their arrival hour for THEIR lane. Does this terminal actually have PreCheck lanes and are they open at that hour (many close in the evening)? Is CLEAR here, and open then? Touchless ID: does this airline offer it at this terminal? If they have none of these, what do standard lanes run at that hour? Does this terminal have a reputation for backing up?
4. INSIDE. Curb-to-checkpoint walk, checkpoint-to-gate walk, trains or trams, notoriously far gates.
5. THE AIRLINE'S RULES. Bag-drop cutoff for this airline at this airport for this route type. Boarding start relative to departure.
6. TODAY SPECIFICALLY. Weather slowing roads or the airport. Holiday or peak travel day. Big events nearby. This airport in the news this week.

## Return
Fill the JSON schema. Minutes are integers. "checkpoint" names the checkpoint to use. "lane" names the lane they will actually use (e.g. "TSA PreCheck" or "standard lanes"). "traffic", "security" and "gate" are one short sentence each. "headsUp" is up to 3 things that genuinely matter for THIS trip, or empty. "tips" is up to 3 insider tips specific to this terminal, or empty. "sources" is up to 4 short notes on what you found where.`;

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      driveMinutes: { type: "integer", description: "Door to departures curb with traffic for that hour" },
      curbToCheckpointMinutes: { type: "integer", description: "Curb to the checkpoint they should use, including bag drop if they check a bag" },
      securityMinutes: { type: "integer", description: "Queue plus screening for their lane at their arrival hour" },
      checkpointToGateMinutes: { type: "integer", description: "Checkpoint to gate area, including trains or long walks" },
      boardingLeadMinutes: { type: "integer", description: "How many minutes before departure boarding starts for this airline and route type" },
      bagDropCutoffMinutes: { type: ["integer", "null"], description: "Airline bag-drop cutoff in minutes before departure, null if no checked bag" },
      checkpoint: { type: "string" },
      lane: { type: "string" },
      traffic: { type: "string" },
      security: { type: "string" },
      gate: { type: ["string", "null"] },
      headsUp: { type: "array", items: { type: "string" } },
      tips: { type: "array", items: { type: "string" } },
      sources: { type: "array", items: { type: "string" } },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
    },
    required: [
      "driveMinutes",
      "curbToCheckpointMinutes",
      "securityMinutes",
      "checkpointToGateMinutes",
      "boardingLeadMinutes",
      "bagDropCutoffMinutes",
      "checkpoint",
      "lane",
      "traffic",
      "security",
      "gate",
      "headsUp",
      "tips",
      "sources",
      "confidence",
    ],
  } as const;

  // max_tool_calls caps the number of web searches (supported by the API; not yet in this SDK's types).
  const maxSearches = Number(process.env.OPENAI_MAX_SEARCHES ?? 8);
  const stream = await openai().responses.create(
    {
      ...({ max_tool_calls: maxSearches } as object),
      model: RESEARCH_MODEL,
      reasoning: { effort: (process.env.OPENAI_RESEARCH_EFFORT as "low" | "medium" | "high") ?? "low" },
      tools: [{ type: "web_search" }],
      instructions: SYSTEM,
      input: user,
      stream: true,
      text: { format: { type: "json_schema", name: "research", strict: true, schema } },
    },
    { timeout: 170_000 },
  );

  let text = "";
  const seenSearches = new Set<string>();
  const noteSearch = (item: unknown) => {
    const it = item as { type?: string; id?: string; action?: { query?: string; queries?: string[] } };
    if (it?.type !== "web_search_call") return;
    const queries = it.action?.queries?.length ? it.action.queries : it.action?.query ? [it.action.query] : [];
    for (const q of queries) {
      const key = q.trim().toLowerCase();
      if (!key || seenSearches.has(key)) continue;
      seenSearches.add(key);
      input.onSearch?.(q.trim());
    }
  };

  for await (const event of stream) {
    switch (event.type) {
      case "response.output_item.added":
      case "response.output_item.done":
        noteSearch(event.item);
        break;
      case "response.output_text.delta":
        text += event.delta;
        break;
      case "response.completed":
        if (!text) {
          const out = event.response.output as Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
          for (const item of out) {
            if (item.type === "message") for (const part of item.content ?? []) if (part.type === "output_text" && part.text) text += part.text;
          }
        }
        break;
      case "response.failed":
      case "response.incomplete":
        throw new Error(`research ${event.type}`);
      default:
        break;
    }
  }

  const parsed = parseJson(text);
  if (!parsed) return null;
  return sanitize(parsed, input, `${RESEARCH_MODEL} + web search`);
}

function parseJson(text: string): Partial<Research> | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as Partial<Research>;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as Partial<Research>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function clamp(n: unknown, lo: number, hi: number, fallback: number): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : fallback;
  return Math.min(hi, Math.max(lo, v));
}

function sanitize(r: Partial<Research>, input: ResearchInput, engine: string): Research {
  const base = fallbackNumbers(input);
  const strings = (arr: unknown, max: number) =>
    Array.isArray(arr) ? arr.filter((s): s is string => typeof s === "string" && s.trim().length > 0).slice(0, max) : [];
  return {
    driveMinutes: clamp(r.driveMinutes, 5, 900, base.driveMinutes),
    curbToCheckpointMinutes: clamp(r.curbToCheckpointMinutes, 2, 60, base.curbToCheckpointMinutes),
    securityMinutes: clamp(r.securityMinutes, 3, 120, base.securityMinutes),
    checkpointToGateMinutes: clamp(r.checkpointToGateMinutes, 2, 45, base.checkpointToGateMinutes),
    boardingLeadMinutes: clamp(r.boardingLeadMinutes, 20, 90, base.boardingLeadMinutes),
    bagDropCutoffMinutes: input.checkedBag ? clamp(r.bagDropCutoffMinutes, 30, 120, base.bagDropCutoffMinutes ?? 45) : null,
    checkpoint: typeof r.checkpoint === "string" && r.checkpoint ? r.checkpoint : base.checkpoint,
    lane: typeof r.lane === "string" && r.lane ? r.lane : base.lane,
    traffic: typeof r.traffic === "string" && r.traffic ? r.traffic : base.traffic,
    security: typeof r.security === "string" && r.security ? r.security : base.security,
    gate: typeof r.gate === "string" && r.gate ? r.gate : null,
    headsUp: withDistanceWarning(input, strings(r.headsUp, 3)),
    tips: strings(r.tips, 3),
    sources: strings(r.sources, 4),
    confidence: r.confidence === "high" || r.confidence === "medium" || r.confidence === "low" ? r.confidence : "medium",
    engine,
  };
}

/** A very long drive usually means the wrong origin or the wrong airport. Say so first. */
function withDistanceWarning(input: ResearchInput, headsUp: string[]): string[] {
  const free = input.route.freeFlowMinutes;
  if (!free || free < 180) return headsUp;
  const hours = Math.round(free / 30) / 2;
  const note = `That's about a ${hours}-hour drive to ${input.flight.departureAirport}. Double-check where you're leaving from.`;
  return [note, ...headsUp].slice(0, 3);
}

function fallbackNumbers(input: ResearchInput): Research {
  const { flight, route, checkedBag, perks } = input;
  const airport = getAirportProfile(flight.departureAirport, {
    name: flight.departureAirportName,
    timezone: flight.departureTimezone,
    coord: flight.airportCoord,
  });
  const terminal = getTerminalProfile(flight.departureAirport, flight.terminal);
  const tz = flight.departureTimezone ?? airport.timezone;
  const road = instantToZonedParts(new Date(new Date(flight.departureTime).getTime() - 2.5 * 3600 * 1000), tz);
  const weekend = road.weekday === "Sat" || road.weekday === "Sun";
  const rush = !weekend && ((road.hour >= 7 && road.hour < 10) || (road.hour >= 15 && road.hour < 19));
  const factor = rush ? 1.45 : road.hour >= 6 && road.hour < 21 ? 1.2 : 1.0;
  const drive = route.freeFlowMinutes ? Math.round(route.freeFlowMinutes * factor) + 5 : 50;
  const expedited = perks.precheck || perks.globalEntry || perks.touchlessId;
  const wait = terminal?.security.waitEstimate ?? { offPeak: 15, normal: 25, peak: 40, holiday: 55 };
  const peakHour = (road.hour >= 5 && road.hour < 9) || (road.hour >= 15 && road.hour < 19);
  const standardWait = peakHour ? wait.peak : wait.normal;
  const security = expedited ? Math.max(8, Math.round(standardWait * 0.45)) : perks.clear ? Math.max(10, Math.round(standardWait * 0.6)) : standardWait;
  const intl = flight.region === "international";
  const curb = (terminal?.curbToSecurityMinutes[1] ?? 8) + (checkedBag ? 12 : 0);
  return {
    driveMinutes: drive,
    curbToCheckpointMinutes: curb,
    securityMinutes: security,
    checkpointToGateMinutes: terminal?.securityToGateMinutes[1] ?? 10,
    boardingLeadMinutes: intl ? airport.standardBoardingBuffer.international : airport.standardBoardingBuffer.domestic,
    bagDropCutoffMinutes: checkedBag ? (intl ? airport.bagCutoffs.checkedInternational : airport.bagCutoffs.checkedDomestic) : null,
    checkpoint: terminal ? `${terminal.name} checkpoint` : "Main checkpoint",
    lane: expedited ? "TSA PreCheck" : perks.clear ? "CLEAR" : "standard lanes",
    traffic: route.originLabel
      ? `${rush ? "Rush hour on the way, so the drive is padded." : "Typical traffic for that hour."}`
      : "No starting point given, so this assumes a typical trip from the metro area.",
    security: `${expedited ? "PreCheck" : perks.clear ? "CLEAR" : "Standard"} lanes usually run about ${security} minutes at that hour.`,
    gate: null,
    headsUp: [],
    tips: [],
    sources: ["Typical numbers for this airport; live search was not available."],
    confidence: "low",
    engine: "typical-numbers",
  };
}

function fallbackResearch(input: ResearchInput, reason: string): Research {
  const base = fallbackNumbers(input);
  input.onNote?.(`Live search unavailable (${reason}). Using typical numbers.`);
  return { ...base, headsUp: ["Live search was unavailable, so these are typical numbers for this airport."] };
}
