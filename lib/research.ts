import { getAirportProfile, getTerminalProfile } from "@/lib/airports";
import { FAST_MODEL, hasOpenAI, openai } from "@/lib/openai";
import { instantToZonedParts } from "@/lib/tz";
import type { FlightInfo } from "@/types/flight";
import type { Perks, Research, RouteEstimate } from "@/types/plan";
import type { WeatherEstimate } from "@/types/weather";

export type Stage = "traffic" | "security" | "rules" | "today" | "synthesis";

export interface ResearchInput {
  flight: FlightInfo;
  route: RouteEstimate;
  weather: WeatherEstimate | null;
  checkedBag: boolean;
  perks: Perks;
  onSearch?: (query: string) => void;
  onStage?: (stage: Stage) => void;
  onNote?: (text: string) => void;
}

/**
 * Speed budget. Four focused web searches run in parallel (one model call
 * each), then one quick synthesis call turns the findings into numbers.
 * Every step has its own timeout so the app always answers.
 */
const SCOUT_TIMEOUT_MS = Number(process.env.RESEARCH_SCOUT_TIMEOUT_MS ?? 14_000);
const SYNTH_TIMEOUT_MS = Number(process.env.RESEARCH_SYNTH_TIMEOUT_MS ?? 18_000);
const CACHE_TTL_MS = Number(process.env.RESEARCH_CACHE_TTL_MS ?? 3 * 3600_000);
const SCOUT_MODEL = process.env.OPENAI_SCOUT_MODEL ?? FAST_MODEL;
const SYNTH_MODEL = process.env.OPENAI_SYNTH_MODEL ?? FAST_MODEL;

interface ScoutResult {
  stage: Exclude<Stage, "synthesis">;
  text: string;
  queries: string[];
}

// Per-instance cache. Serverless instances are short-lived, but a warm one
// makes a retry or a second traveler at the same terminal near-instant.
const cache = new Map<string, { at: number; value: ScoutResult }>();

export async function researchTrip(input: ResearchInput): Promise<Research> {
  if (!hasOpenAI()) return fallbackResearch(input, "No OpenAI key configured");
  try {
    const result = await runResearch(input);
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

interface TripContext {
  flightLine: string;
  terminalLabel: string;
  arrivalHour: string;
  weekday: string;
  dateLabel: string;
  originLine: string;
  lanes: string;
  bag: string;
  weatherLine: string;
  tz: string;
}

function buildContext(input: ResearchInput): TripContext {
  const { flight, route, weather, checkedBag, perks } = input;
  const tz = flight.departureTimezone ?? "America/New_York";
  const dep = new Date(flight.departureTime);
  const depParts = instantToZonedParts(dep, tz);
  const arrival = instantToZonedParts(new Date(dep.getTime() - 2 * 3600_000), tz);
  const airportName = flight.departureAirportName ? `${flight.departureAirport} (${flight.departureAirportName})` : flight.departureAirport;
  return {
    tz,
    flightLine: `${flight.flightNumber} (${flight.airlineName}), ${flight.region}, departing ${airportName} at ${depParts.hhmm} on ${depParts.weekday} ${depParts.isoDate} to ${flight.destinationCity ?? flight.destinationAirportCode ?? "unknown"}`,
    terminalLabel: flight.terminal ? `${flight.departureAirport} Terminal ${flight.terminal}` : `${flight.departureAirport} (terminal not published; find which terminal ${flight.airlineName} uses)`,
    arrivalHour: arrival.hhmm,
    weekday: depParts.weekday,
    dateLabel: depParts.isoDate,
    originLine: route.originLabel
      ? `${route.originLabel}${route.freeFlowMinutes ? ` (routing engine: ${route.freeFlowMinutes} min with no traffic, ${route.distanceKm ?? "?"} km)` : ""}`
      : "not given; assume a typical trip from within the metro area",
    lanes: describeLanes(perks),
    bag: checkedBag ? "checking a bag" : "carry-on only with a mobile boarding pass",
    weatherLine: weather ? `${weather.summary}${weather.notes.length ? ` ${weather.notes.join(" ")}` : ""}` : "unknown",
  };
}

const SCOUT_SYSTEM = `You are a research scout for Leave By, an app that tells one traveler when to walk out the door for a flight. You have web search. Answer ONE focused question about THIS airport, THIS terminal, THIS hour, THIS day. Run one or two searches, then answer.

Rules: be specific and current. Prefer official sources (airport, TSA, airline, DOT) and recent reports. Give numbers where you can (minutes, hours of operation, cutoffs). Say "not found" for anything you could not verify rather than guessing. Keep it under 130 words, plain sentences, no headers. End with a line "Sources:" listing up to 3 short source names.`;

function scoutPrompts(c: TripContext, input: ResearchInput): Array<{ stage: ScoutResult["stage"]; question: string; cacheKey: string }> {
  const { flight, route } = input;
  const terminalKey = `${flight.departureAirport}|${flight.terminal ?? flight.airlineCode}`;
  const hourBucket = c.arrivalHour.slice(0, 2);
  const originKey = route.originCoord ? `${route.originCoord.lat.toFixed(2)},${route.originCoord.lon.toFixed(2)}` : "none";
  return [
    {
      stage: "traffic",
      cacheKey: `traffic|${terminalKey}|${c.weekday}|${hourBucket}|${originKey}`,
      question: `Getting to ${c.terminalLabel} by car or rideshare from ${c.originLine}, arriving around ${c.arrivalHour} on a ${c.weekday}. What is a realistic door-to-curb drive time with typical traffic for that hour? Name the chokepoints. Is there active roadway, curb, or parking construction at the airport this month, and where do rideshares drop off at this terminal?`,
    },
    {
      stage: "security",
      cacheKey: `security|${terminalKey}|${c.weekday}|${hourBucket}|${c.lanes}`,
      question: `Security at ${c.terminalLabel} around ${c.arrivalHour} on a ${c.weekday} for a traveler with: ${c.lanes}. Which checkpoints does this terminal have and which is usually shorter? What is the typical wait for their lane at that hour? Are TSA PreCheck lanes open at that hour here (some close evenings)? Is CLEAR present at this terminal and open then? Does this terminal have a reputation for backing up?`,
    },
    {
      stage: "rules",
      cacheKey: `rules|${terminalKey}|${flight.region}|${input.checkedBag}`,
      question: `For ${flight.airlineName} at ${c.terminalLabel} on a ${flight.region} flight, traveler ${c.bag}: what is the bag-drop cutoff (minutes before departure) and when does boarding start relative to departure? How long is the walk from the curb to the checkpoint and from the checkpoint to the gates, including any trains, tunnels, or notoriously far gates?`,
    },
    {
      stage: "today",
      cacheKey: `today|${flight.departureAirport}|${c.dateLabel}`,
      question: `Anything unusual at ${flight.departureAirport} on ${c.dateLabel} (${c.weekday})? Holiday or peak travel period, big events near the airport, strikes, weather that slows the roads or the airport (forecast: ${c.weatherLine}), and this airport in the news this week. Flight: ${c.flightLine}.`,
    },
  ];
}

async function runScout(prompt: { stage: ScoutResult["stage"]; question: string; cacheKey: string }, input: ResearchInput): Promise<ScoutResult> {
  const hit = cache.get(prompt.cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    input.onStage?.(prompt.stage);
    for (const q of hit.value.queries) input.onSearch?.(q);
    return hit.value;
  }
  input.onStage?.(prompt.stage);
  const queries: string[] = [];
  const stream = await openai().responses.create(
    {
      model: SCOUT_MODEL,
      tools: [{ type: "web_search" }],
      ...({ max_tool_calls: 2 } as object),
      instructions: SCOUT_SYSTEM,
      input: prompt.question,
      stream: true,
    },
    { timeout: SCOUT_TIMEOUT_MS },
  );
  let text = "";
  const seen = new Set<string>();
  const deadline = Date.now() + SCOUT_TIMEOUT_MS;
  for await (const event of stream) {
    if (Date.now() > deadline) throw new Error(`scout ${prompt.stage} timed out`);
    if (event.type === "response.output_item.added" || event.type === "response.output_item.done") {
      const it = event.item as { type?: string; action?: { query?: string; queries?: string[] } };
      if (it?.type === "web_search_call") {
        const qs = it.action?.queries?.length ? it.action.queries : it.action?.query ? [it.action.query] : [];
        for (const q of qs) {
          const key = q.trim().toLowerCase();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          queries.push(q.trim());
          input.onSearch?.(q.trim());
        }
      }
    } else if (event.type === "response.output_text.delta") {
      text += event.delta;
    } else if (event.type === "response.failed" || event.type === "response.incomplete") {
      throw new Error(`scout ${prompt.stage} ${event.type}`);
    }
  }
  const value: ScoutResult = { stage: prompt.stage, text: text.trim(), queries };
  if (value.text) cache.set(prompt.cacheKey, { at: Date.now(), value });
  return value;
}

const SYNTH_SYSTEM = `You are the brain behind Leave By. You turn research notes into the minutes a traveler needs, and into a few plain sentences shown on a phone.

Judgment: err a little protective (a missed flight costs hours, ten spare minutes cost nothing) but do not pad every number; travelers stop trusting an app that always says four hours. Where a note says "not found", use the airport's typical pattern. Never include the traveler's gate time; the app adds it.

Writing: plain words, no jargon, no hedging, at most 18 words per sentence. Name the specific thing (the checkpoint, the road, the rule). "headsUp" is only things that genuinely change this trip; empty is fine.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    driveMinutes: { type: "integer", description: "Door to departures curb with traffic for that hour" },
    curbToCheckpointMinutes: { type: "integer", description: "Curb to the checkpoint they should use, including bag drop if they check a bag" },
    securityMinutes: { type: "integer", description: "Queue plus screening for their lane at their arrival hour" },
    checkpointToGateMinutes: { type: "integer", description: "Checkpoint to gate area, including trains or long walks" },
    boardingLeadMinutes: { type: "integer", description: "Minutes before departure that boarding starts" },
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

async function runResearch(input: ResearchInput): Promise<Research | null> {
  const c = buildContext(input);
  const prompts = scoutPrompts(c, input);
  const settled = await Promise.allSettled(prompts.map((p) => runScout(p, input)));
  const notes: ScoutResult[] = [];
  const failed: string[] = [];
  settled.forEach((s, i) => {
    if (s.status === "fulfilled" && s.value.text) notes.push(s.value);
    else failed.push(prompts[i].stage);
  });
  if (!notes.length) return null;
  if (failed.length) input.onNote?.(`Some lookups timed out: ${failed.join(", ")}.`);

  input.onStage?.("synthesis");
  const user = `## The trip
- ${c.flightLine}
- Terminal: ${c.terminalLabel}
- Likely at the airport around ${c.arrivalHour} on a ${c.weekday}
- Leaving from: ${c.originLine}
- Getting there by car or rideshare, dropped at the departures curb
- Bag: ${c.bag}
- Skip-the-line: ${c.lanes}
- Weather forecast near departure: ${c.weatherLine}

## Research notes (from live web searches just now)
${notes.map((n) => `### ${n.stage}\n${n.text}`).join("\n\n")}
${failed.length ? `\n(Notes missing for: ${failed.join(", ")}. Use typical patterns for those and lower confidence.)` : ""}

## Return
Fill the JSON schema. Minutes are integers. "checkpoint" names the checkpoint to use. "lane" names the lane they will actually use. "traffic", "security", and "gate" are one short sentence each. "headsUp" up to 3, "tips" up to 3, "sources" up to 4 short notes on what came from where.`;

  const response = await openai().responses.create(
    {
      model: SYNTH_MODEL,
      instructions: SYNTH_SYSTEM,
      input: user,
      text: { format: { type: "json_schema", name: "research", strict: true, schema: SCHEMA } },
    },
    { timeout: SYNTH_TIMEOUT_MS },
  );
  const parsed = parseJson(response.output_text);
  if (!parsed) return null;
  const engine = `${SCOUT_MODEL} scouts + ${SYNTH_MODEL}`;
  const result = sanitize(parsed, input, engine);
  if (failed.length && result.confidence === "high") result.confidence = "medium";
  return result;
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
  return { ...base, headsUp: withDistanceWarning(input, ["Live search was unavailable, so these are typical numbers for this airport."]) };
}
